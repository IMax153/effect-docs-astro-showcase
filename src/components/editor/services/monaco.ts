import type * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import * as GlobalValue from "effect/GlobalValue"
import * as Layer from "effect/Layer"

export type MonacoApi = typeof monaco

export class MonacoError extends Data.TaggedError("MonacoError")<{
  readonly reason: "LoadApi"
  readonly message: string
}> {
  constructor(reason: MonacoError["reason"], message: string) {
    super({ reason, message: `${reason}: ${message}` })
  }
}

const loadApi = GlobalValue.globalValue("app/Monaco/loadApi", () =>
  Effect.async<MonacoApi, MonacoError>((resume) => {
    const script = document.createElement("script")
    script.src = "/vendor/monaco/min/vs/loader.js"
    script.async = true
    script.onload = () => {
      const require = globalThis.require as any

      require.config({
        paths: {
          vs: `${window.location.protocol}//${window.location.host}/vendor/monaco/min/vs`
        },
        // This is something you need for monaco to work
        ignoreDuplicateModules: ["vs/editor/editor.main"]
      })

      require(["vs/editor/editor.main", "vs/language/typescript/tsWorker"], (
        monaco: MonacoApi,
        _tsWorker: any
      ) => {
        const isOK = monaco && (window as any).ts
        if (!isOK) {
          resume(
            new MonacoError(
              "LoadApi",
              "Unable to setup all playground dependencies!"
            )
          )
        } else {
          resume(Effect.succeed(monaco))
        }
      })
    }
    document.body.appendChild(script)
  }).pipe(Effect.cached, Effect.runSync)
)

const make = Effect.gen(function*() {
  const monaco = yield* loadApi

  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)

  monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
    customWorkerPath: `${new URL(window.location.origin)}vendor/monaco/ts.worker.js`
  })

  function makeEditor(element: HTMLElement) {
    return Effect.gen(function*() {
      const editor = yield* Effect.acquireRelease(
        Effect.sync(() => monaco.editor.create(element, {
          automaticLayout: true,
          fixedOverflowWidgets: true,
          fontSize: 16,
          quickSuggestions: {
            comments: false,
            other: true,
            strings: true
          }
        })),
        (editor) => Effect.sync(() => editor.dispose())
      )

      const model = monaco.editor.createModel("export const foo: string = 'foo'", "typescript")

      editor.setModel(model)

      return {
        editor
      } as const
    })
  }

  return {
    monaco,
    makeEditor
  } as const
})

export class Monaco extends Effect.Tag("app/Monaco")<
  Monaco,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(this, make)
}

