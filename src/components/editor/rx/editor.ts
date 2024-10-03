import { Rx } from "@effect-rx/rx-react"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schedule from "effect/Schedule"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { themeRx } from "@/rx/theme"
import { Toaster } from "@/services/toaster"
import { type Directory, type File, type FullPath, type Workspace } from "../domain/workspace"
import { Monaco } from "../services/monaco"
import { WebContainer } from "../services/webcontainer"
import { typeAcquisitionPlugin } from "./plugins/type-acquisition"
import type { RxWorkspaceHandle } from "./workspace"
import { formattingPlugin } from "./plugins/formatting"
import { tsconfigPlugin } from "./plugins/tsconfig"

const runtime = Rx.runtime(Layer.mergeAll(
  Monaco.Live,
  Toaster.Live
)).pipe(Rx.setIdleTTL("10 seconds"))

export const editorThemeRx = Rx.map(themeRx, (theme) =>
  theme === "dark" ? "vs-dark" : "vs"
)

export declare namespace Editor {
  export type FileType = "File" | "Directory"

  export interface CreateFileOptions {
    readonly parent?: Directory
  }
}

export const editorRx = Rx.family((handle: RxWorkspaceHandle) => {
  const element = Rx.make(Option.none<HTMLElement>())

  const editor = runtime.rx((get) =>
    Effect.gen(function*() {
      const monaco = yield* Monaco
      const container = yield* WebContainer

      const el = yield* get.some(element)
      const editor = yield* monaco.makeEditor(el)
      const workspace = get.once(handle.workspace)

      // Sync the website theme with the editor
      get.subscribe(
        editorThemeRx,
        (theme) => editor.editor.updateOptions({ theme }),
        { immediate: true }
      )

      // Loads a workspace into the editor
      function loadWorkspace(workspace: Workspace) {
        return container.mountWorkspace(workspace).pipe(
          Effect.zipRight(
            Effect.forEach(workspace.filePaths, ([file, path]) => {
              const fullPath = workspace.relativePath(path)
              if (file._tag === "Directory") {
                return container.makeDirectory(fullPath).pipe(
                  Effect.catchTag("FileAlreadyExistsError", () => Effect.void)
                )
              }
              return editor.writeFile(fullPath, file.initialContent, file.language)
            }, { discard: true })
          )
        )
      }

      // Syncs editor content with the underlying file system
      function sync(fullPath: FullPath, file: File) {
        return editor.readFile(fullPath).pipe(
          Stream.tap((model) => editor.loadModel(model)),
          Stream.flatMap(() => editor.content.pipe(Stream.drop(1))),
          Stream.debounce("2 seconds"),
          Stream.tap((content) => editor.writeFile(fullPath, content, file.language)),
          Stream.ensuring(Effect.suspend(() => {
            const content = editor.editor.getValue()
            if (content.trim().length === 0) {
              return Effect.void
            }
            return editor.writeFile(fullPath, content, file.language)
          })),
        )
      }


      // Perform the initial load of the workspace file system
      yield* loadWorkspace(workspace).pipe(
        Effect.tapErrorCause(Effect.logError)
      )

      // Load the snapshots in the background
      const snapshotsFiber = yield* container.mountSnapshots(workspace).pipe(
        Effect.zipRight(container.writeFile(workspace.relativePath(".npmrc"), npmRc)),
        Effect.zipRight(container.runInWorkspace(workspace, workspace.prepare)),
        Effect.zipRight(Deferred.succeed(handle.workspaceReady, void 0)),
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped
      )

      yield* Fiber.await(snapshotsFiber).pipe(
        Effect.zipRight(typeAcquisitionPlugin(handle)),
        Effect.zipRight(formattingPlugin(handle)),
        Effect.zipRight(tsconfigPlugin(handle)),
        Effect.tapErrorCause(Effect.logError),
        Effect.forkScoped
      )

      // Ensure the editor reflects changes to the selected workspace file
      yield* get.stream(handle.selectedFile).pipe(
        Stream.bindTo("file"),
        Stream.bindEffect("workspace", () => SubscriptionRef.get(handle.workspaceRef)),
        Stream.bindEffect("path", ({ file, workspace }) => workspace.pathTo(file)),
        Stream.bindEffect("fullPath", ({ file, workspace }) => workspace.fullPathTo(file)),
        Stream.flatMap(({ file, fullPath }) => sync(fullPath, file), { switch: true }),
        Stream.runDrain,
        Effect.tapErrorCause(Effect.logError),
        Effect.retry(Schedule.spaced(200)),
        Effect.forkScoped
      )

      return {
        ...editor,
        createFile: Rx.fn((params: Parameters<typeof createFile>, get) =>
          createFile(...params).pipe(Effect.flatMap((node) =>
            node._tag === "File"
              ? get.set(handle.selectedFile, node)
              : Effect.void
          ))
        )
      } as const
    })
  )

  return {
    editor,
    element
  } as const
})

const npmRc = `store-dir=.pnpm-store\n`

