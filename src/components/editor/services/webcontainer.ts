import { type FileSystemTree, WebContainer as WC } from "@webcontainer/api"
import * as Effect from "effect/Effect"
import * as GlobalValue from "effect/GlobalValue"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type { Scope } from "effect/Scope"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import {
  Directory,
  File,
  FileNotFoundError,
  FileValidationError,
  makeDirectory,
  makeFile,
  Workspace
} from "../domain/workspace"

const WEBCONTAINER_PROCESS_PATH = "node_modules/.bin:/usr/local/bin:/usr/bin:/bin"

const semaphore = GlobalValue.globalValue("app/WebContainer/semaphore", () =>
  Effect.unsafeMakeSemaphore(1)
)

const make = Effect.gen(function*() {
  // Only one instance of a Webcontainer can be running at any given time
  yield* Effect.acquireRelease(semaphore.take(1), () => semaphore.release(1))

  // Boot up the actual WebContainer instance
  const container = yield* Effect.acquireRelease(
    Effect.promise(() => WC.boot()),
    (container) => Effect.sync(() => container.teardown())
  )

  const activeWorkspaces = new Set<Workspace.Handle>()
  const workspaceScopes = new WeakMap<Workspace.Handle, Scope>()

  // Create a constructor for a process in the WebContainer process which can 
  // be used to obtain scoped access to a shell
  const makeShell = Effect.acquireRelease(
    Effect.promise(() =>
      container.spawn("jsh", [], {
        env: {
          PATH: WEBCONTAINER_PROCESS_PATH,
          NODE_NO_WARNINGS: "1"
        }
      })
    ),
    (process) => Effect.sync(() => process.kill())
  )

  function spawn(command: string) {
    return Effect.acquireRelease(
      Effect.promise(() =>
        container.spawn("jsh", ["-c", command], {
          env: {
            PATH: WEBCONTAINER_PROCESS_PATH
          }
        })
      ),
      (process) => Effect.sync(() => process.kill())
    )
  }

  function run(command: string) {
    return spawn(command).pipe(
      Effect.flatMap((process) => Effect.promise(() => process.exit)),
      Effect.scoped
    )
  }

  function setupWorkspace(workspace: Workspace) {
    return Effect.gen(function*() {
      const workspaceRef = yield* SubscriptionRef.make(workspace)

      function pathInWorkspace(path: string) {
        return `${workspace.name}/${path}`
      }

      function runInWorkspace(command: string) {
        return run(`cd ${workspace.name} && ${command}`)
      }

      function validateFileName(name: string, type: "File" | "Directory") {
        return Effect.gen(function*() {
          if (name.length === 0 || name.includes("/")) {
            return yield* new FileValidationError({ reason: "InvalidName" })
          }
          if (type === "File" && !name.endsWith(".ts")) {
            return yield* new FileValidationError({ reason: "UnsupportedType" })
          }
          return yield* Effect.void
        })
      }

      const clearWorkspace = Effect.promise(() => container.fs.rm(workspace.name, {
        recursive: true,
        force: true
      }))

      // Setup a clean file system for the workspace
      yield* Effect.acquireRelease(
        clearWorkspace.pipe(
          Effect.zipRight(Effect.promise(
            () => container.fs.mkdir(pathInWorkspace(".pnpm-store"), {
              recursive: true
            })
          ))
        ),
        () => clearWorkspace
      )

      yield* Effect.promise(() => container.fs.writeFile(pathInWorkspace(".npmrc"), npmRc))

      yield* Effect.promise(() => container.mount(treeFromWorkspace(workspace), {
        mountPoint: workspace.name
      }))

      function writeFile(file: string, data: string) {
        return Effect.promise(() => container.fs.writeFile(pathInWorkspace(file), data))
      }

      function mkdir(directory: string) {
        return Effect.promise(() => container.fs.mkdir(pathInWorkspace(directory)))
      }

      function readFile(file: string) {
        return Effect.tryPromise({
          try: () => container.fs.readFile(pathInWorkspace(file)),
          catch: () => new FileNotFoundError({ file })
        }).pipe(Effect.map((bytes) => new TextDecoder().decode(bytes)))
      }

      function createFile(parentDirectory: Option.Option<Directory>, name: string, type: "File" | "Directory") {
        return Effect.gen(function*() {
          // Make sure we got a valid file name
          yield* validateFileName(name, type)
          // Get the current workspace
          const workspace = yield* SubscriptionRef.get(workspaceRef)
          // Compute the path to the new workspace file node
          const newPath = Option.match(parentDirectory, {
            onNone: () => name,
            onSome: (directory) => `${Option.getOrThrow(workspace.pathTo(directory))}/${name}`
          })
          // Write the file to the container file system
          yield* type === "File" ? writeFile(newPath, "") : mkdir(newPath)
          // Create the file node
          const node = type === "File" ? makeFile(name, "", true) : makeDirectory(name, [], true)
          // Add the file node to the workspace
          yield* SubscriptionRef.set(workspaceRef, Option.match(parentDirectory, {
            onNone: () => workspace.append(node),
            onSome: (directory) => workspace.replaceNode(
              directory,
              makeDirectory(
                directory.name,
                [...directory.children, node],
                directory.userManaged
              )
            )
          }))
          // Return the newly created node
          return node
        }).pipe(
          Effect.tapErrorCause(Effect.logError),
          Effect.annotateLogs({ service: "WebContainer", method: "createFile", name, type })
        )
      }

      function renameFile(node: File | Directory, newName: string) {
        return Effect.gen(function*() {
          // Make sure we got a valid file name
          yield* validateFileName(newName, node._tag)
          // Get the current workspace
          const workspace = yield* SubscriptionRef.get(workspaceRef)
          // Create a new file node with the updated name
          const newNode = node._tag === "File"
            ? makeFile(newName, node.initialContent, node.userManaged)
            : makeDirectory(newName, node.children, node.userManaged)
          // Create a new workspace with the new node inserted into the tree
          const newWorkspace = workspace.replaceNode(node, newNode)
          // Get the path to the old file node
          const oldPath = yield* Effect.orDie(workspace.pathTo(node))
          // Get the path to the new file node
          const newPath = yield* Effect.orDie(workspace.pathTo(newNode))
          // Rename the file on the container file system
          yield* Effect.promise(() =>
            container.fs.rename(pathInWorkspace(oldPath), pathInWorkspace(newPath))
          )
          // Update the workspace ref with the new workspace
          yield* SubscriptionRef.set(workspaceRef, newWorkspace)
          // Return the updated node
          return newNode
        }).pipe(
          Effect.tapErrorCause(Effect.logError),
          Effect.annotateLogs({ service: "WebContainer", method: "renameFile", file: node, newName })
        )
      }

      function removeFile(node: File | Directory) {
        return Effect.gen(function*() {
          // Get the current workspace
          const workspace = yield* SubscriptionRef.get(workspaceRef)
          // Create a new workspace with the node removed
          const newWorkspace = workspace.removeNode(node)
          // Get the path to the removed node
          const nodePath = yield* Effect.orDie(workspace.pathTo(node))
          // Remove the node from the container file system
          yield* Effect.promise(() => container.fs.rm(pathInWorkspace(nodePath), {
            recursive: true
          }))
          // Update the workspace ref with the new workspace
          yield* SubscriptionRef.set(workspaceRef, newWorkspace)
        }).pipe(
          Effect.tapErrorCause(Effect.logError),
          Effect.annotateLogs({ service: "WebContainer", method: "removeFile", file: node })
        )
      }

      function watchFile(file: string) {
        const changes = Stream.async<void>((emit) => {
          const watcher = container.fs.watch(pathInWorkspace(file), () => {
            emit.single(void 0)
          })
          return Effect.sync(() => watcher.close())
        }).pipe(Stream.mapEffect(() => readFile(file)))
        return readFile(file).pipe(Stream.concat(changes), Stream.changes)
      }

      const handle: Workspace.Handle = {
        workspace: workspaceRef,
        makeShell,
        run: runInWorkspace,
        createFile,
        renameFile,
        removeFile,
        readFile,
        watchFile
      }

      const scope = yield* Effect.scope
      activeWorkspaces.add(handle)
      workspaceScopes.set(handle, scope)
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => workspaceScopes.delete(handle))
      )

      return handle
    }).pipe(Effect.annotateLogs({ workspace: workspace.name }))
  }

  return {
    makeShell,
    setupWorkspace
  } as const
}).pipe(Effect.annotateLogs({ service: "WebContainer" }))

export class WebContainer extends Effect.Tag("app/WebContainer")<
  WebContainer,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(this, make)
}

const npmRc = `store-dir=.pnpm-store\n`

function treeFromWorkspace(workspace: Workspace): FileSystemTree {
  function walk(children: Workspace["tree"]): FileSystemTree {
    const tree: FileSystemTree = {}
    children.forEach((child) => {
      if (child._tag === "File") {
        tree[child.name] = {
          file: { contents: child.initialContent }
        }
      } else {
        tree[child.name] = {
          directory: walk(child.children)
        }
      }
    })
    return tree
  }
  return walk(workspace.tree)
}
