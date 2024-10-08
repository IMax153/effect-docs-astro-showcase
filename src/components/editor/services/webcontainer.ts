import { WebContainer as WC, type FileSystemTree } from "@webcontainer/api"
import * as HttpClient from "@effect/platform/HttpClient"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as Effect from "effect/Effect"
import * as GlobalValue from "effect/GlobalValue"
import * as Layer from "effect/Layer"
import * as Stream from "effect/Stream"
import { FileAlreadyExistsError, FileNotFoundError, Workspace } from "../domain/workspace"

const WEBCONTAINER_BIN_PATH = "node_modules/.bin:/usr/local/bin:/usr/bin:/bin"

const semaphore = GlobalValue.globalValue("app/WebContainer/semaphore", () =>
  Effect.unsafeMakeSemaphore(1)
)

const make = Effect.gen(function*() {
  // Only one instance of a Webcontainer can be running at any given time
  yield* Effect.acquireRelease(semaphore.take(1), () => semaphore.release(1))

  const httpClient = (yield* HttpClient.HttpClient).pipe(
    HttpClient.filterStatusOk
  )

  const container = yield* Effect.acquireRelease(
    Effect.promise(() => WC.boot()),
    (container) => Effect.sync(() => container.teardown())
  )

  const makeShell = Effect.acquireRelease(
    Effect.promise(() =>
      container.spawn("jsh", [], {
        env: {
          PATH: WEBCONTAINER_BIN_PATH,
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
            PATH: WEBCONTAINER_BIN_PATH
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

  function runInWorkspace(workspace: Workspace, command: string) {
    return run(`cd ${workspace.name} && ${command}`)
  }

  function mountSnapshots(workspace: Workspace) {
    return Effect.gen(function*() {
      const storeDir = workspace.relativePath(".pnpm-store")

      yield* Effect.promise(() =>
        container.fs.mkdir(storeDir, { recursive: true })
      )

      const concurrency = workspace.snapshots.length
      return yield* Effect.forEach(workspace.snapshots, (snapshot) =>
        httpClient.get(`/snapshots/${encodeURIComponent(snapshot)}`).pipe(
          Effect.flatMap((response) => response.arrayBuffer),
          Effect.scoped,
          Effect.flatMap((buffer) =>
            Effect.promise(() =>
              container.mount(buffer, {
                mountPoint: storeDir
              })
            )
          )
        ),
        { concurrency, discard: true }
      )
    })
  }

  function mountWorkspace(workspace: Workspace) {
    return Effect.promise(async () => {
      await container.fs.mkdir(workspace.name, { recursive: true })
      await container.mount(treeFromWorkspace(workspace), {
        mountPoint: workspace.name
      })
    }
    )
  }

  function installExe(name: string, script: string) {
    return Effect.promise(async () => {
      await container.fs.writeFile(name, script)
      await container.spawn("chmod", ["+x", name])
    })
  }

  function readFile(path: string) {
    return Effect.tryPromise({
      try: () => container.fs.readFile(path),
      catch: () => new FileNotFoundError({ path })
    }).pipe(Effect.map((bytes) => new TextDecoder().decode(bytes)))
  }

  function writeFile(path: string, data: string) {
    return Effect.promise(() => container.fs.writeFile(path, data))
  }

  function watchFile(path: string) {
    const changes = Stream.async<void>((emit) => {
      const watcher = container.fs.watch(path, (_event) => {
        emit.single(void 0)
      })
      return Effect.sync(() => watcher.close())
    }).pipe(Stream.mapEffect(() => readFile(path)))
    return readFile(path).pipe(Stream.concat(changes), Stream.changes)
  }

  function makeDirectory(path: string) {
    return Effect.tryPromise({
      try: () => container.fs.mkdir(path),
      catch: () => new FileAlreadyExistsError({ path })
    })
  }

  function readDirectory(path: string) {
    return Effect.promise(() => container.fs.readdir(path, { withFileTypes: true }))
  }

  // Install the default executables into the container
  yield* installExe("run", runExe)

  return {
    makeShell,
    mountSnapshots,
    mountWorkspace,
    readFile,
    writeFile,
    watchFile,
    makeDirectory,
    readDirectory,
    run,
    runInWorkspace
  } as const
})

export class WebContainer extends Effect.Tag("app/WebContainer")<
  WebContainer,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(this, make).pipe(
    Layer.provide(FetchHttpClient.layer)
  )
}

const runExe = `#!/usr/bin/env node
const ChildProcess = require("node:child_process")
const Path = require("node:path")

const outDir = "dist"
const program = process.argv[2]
const programJs = program.replace(/\.ts$/, ".js")
const compiledProgram = Path.join(outDir, Path.basename(programJs))

function run() {
  ChildProcess.spawn("tsc-watch", [
    "--module", "nodenext",
    "--outDir", outDir,
    "--sourceMap", "true",
    "--target", "esnext",
    "--lib", "ES2022,DOM,DOM.Iterable",
    program,
    "--onSuccess", \`node --enable-source-maps \${compiledProgram}\`
  ], {
    stdio: "inherit"
  }).on("exit", function() {
    console.clear()
    run()
  })
}

run()
`

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

