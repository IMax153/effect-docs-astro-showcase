import type * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
import * as GlobalValue from "effect/GlobalValue"
import * as Layer from "effect/Layer"
import * as Stream from "effect/Stream"
import { WebContainer } from "./webcontainer"
import { FileNotFoundError } from "../domain/workspace"
import type ts from "typescript"
import {
  FileSystemProviderCapabilities,
  registerFileSystemOverlay,
  type IFileSystemProviderWithFileReadWriteCapability
} from "@codingame/monaco-vscode-files-service-override"

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

      require([
        "vs/editor/editor.main",
        "vs/language/typescript/tsWorker"
      ], (monaco: MonacoApi, _tsWorker: any) => {
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

const make = Effect.gen(function* () {
  const monaco = yield* loadApi
  const container = yield* WebContainer

  const ts = (window as any).ts as typeof import("typescript")

  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)

  monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
    customWorkerPath: `${new URL(
      window.location.origin
    )}vendor/monaco/ts.worker.js`
  })

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    exactOptionalPropertyTypes: true,
    module: ts.ModuleKind.NodeNext as any,
    moduleResolution: ts.ModuleResolutionKind.NodeNext as any,
    strict: true,
    target: ts.ScriptTarget.ESNext as any
  })

  setupCompletionItemProviders(monaco)
  setupTwoslash(monaco)
  registerFileSystemOverlay(1, {
    capabilities: 2,
    onDidChangeCapabilities: new monaco.Emitter().event,
    onDidChangeFile: new monaco.Emitter().event,
    delete(resource, opts) {
      console.log("delete", resource, opts)
      return new Promise(() => {})
    },
    mkdir(resource) {
      console.log("mkdir", resource)
      return new Promise(() => {})
    },
    readdir(resource) {
      console.log("readdir", resource)
      return new Promise(() => {})
    },
    readFile(resource) {
      console.log("readFile", resource)
      return new Promise(() => {})
    },
    rename(from, to, opts) {
      console.log("rename", from, to, opts)
      return new Promise(() => {})
    },
    stat(resource) {
      console.log("stat", resource)
      return new Promise(() => {})
    },
    writeFile(resource, content) {
      console.log("writeFile", resource, content)
      return new Promise(() => {})
    },
    watch(resource, opts) {
      console.log("watch", resource, opts)
      return { dispose() {} }
    }
  })

  function makeEditor(element: HTMLElement) {
    return Effect.gen(function* () {
      const editor = yield* Effect.acquireRelease(
        Effect.sync(() =>
          monaco.editor.create(element, {
            automaticLayout: true,
            fixedOverflowWidgets: true,
            fontSize: 16,
            minimap: { enabled: false },
            quickSuggestions: {
              comments: false,
              other: true,
              strings: true
            }
          })
        ),
        (editor) =>
          Effect.sync(() => {
            monaco.editor.getModels().forEach((model) => model.dispose())
            editor.dispose()
          })
      )

      function getModel(path: string) {
        return Effect.gen(function* () {
          const uri = monaco.Uri.file(path)
          const model = monaco.editor.getModel(uri)
          if (model === null) {
            return yield* new FileNotFoundError({ path })
          }
          return model
        })
      }

      function createModel(
        path: string,
        content: string,
        language: string
      ) {
        return Effect.sync(() => {
          const uri = monaco.Uri.file(path)
          return monaco.editor.createModel(content, language, uri)
        })
      }

      const viewStates = new Map<
        string,
        monaco.editor.ICodeEditorViewState | null
      >()

      function loadModel(model: monaco.editor.ITextModel) {
        return Effect.sync(() => {
          const current = editor.getModel()
          // If the current model matches the model to load, there is no further
          // work to do and we can return the model directly
          if (current !== null && current === model) {
            return model
          }
          // Otherwise, handle the editor view state
          const fsPath = model.uri.fsPath
          if (current !== null) {
            // Make sure to save the view state for the outgoing model
            viewStates.set(fsPath, editor.saveViewState())
          }
          editor.setModel(model)
          if (viewStates.has(fsPath)) {
            // Make sure to restore the view state for the incoming model
            editor.restoreViewState(viewStates.get(fsPath)!)
          }
          return model
        })
      }

      function readFile(path: string) {
        return Effect.gen(function* () {
          const model = yield* getModel(path)
          const content = yield* container.readFile(path)
          // Prevent constantly re-triggerring `IModelContentChanged` events
          if (model.getValue() !== content) {
            model.setValue(content)
          }
          return model
        })
      }

      function writeFile(
        path: string,
        content: string,
        language: string
      ) {
        return getModel(path).pipe(
          Effect.tap((model) => {
            // Prevent constantly re-triggerring `IModelContentChanged` events
            if (model.getValue() !== content) {
              return model.setValue(content)
            }
          }),
          Effect.orElse(() => createModel(path, content, language)),
          Effect.zipLeft(container.writeFile(path, content))
        )
      }

      const content = Stream.async<string>((emit) => {
        const disposable = editor.onDidChangeModelContent(() => {
          emit.single(editor.getValue())
        })
        return Effect.sync(() => disposable.dispose())
      })

      return {
        editor,
        loadModel,
        readFile,
        writeFile,
        content
      } as const
    }).pipe(Effect.tapErrorCause(Effect.log))
  }

  return {
    monaco,
    makeEditor
  } as const
}).pipe(Effect.tapErrorCause(Effect.log))

export class Monaco extends Effect.Tag("app/Monaco")<
  Monaco,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(this, make).pipe(
    Layer.provideMerge(WebContainer.Live)
  )
}

function setupTwoslash(monaco: MonacoApi) {
  monaco.languages.registerInlayHintsProvider(
    [
      { language: "javascript" },
      { language: "typescript" },
      { language: "typescriptreact" },
      { language: "javascriptreact" }
    ],
    {
      displayName: "twoslash",
      provideInlayHints: async (model, _, cancellationToken) => {
        const text = model.getValue()
        const queryRegex = /^\s*\/\/\.?\s*\^\?/gm
        const inlineQueryRegex =
          /^[^\S\r\n]*(?<start>\S).*\/\/\s*(?<end>=>)/gm
        const results: Array<monaco.languages.InlayHint> = []

        const worker = await monaco.languages.typescript
          .getTypeScriptWorker()
          .then((worker) => worker(model.uri))

        if (model.isDisposed()) {
          return {
            hints: [],
            dispose: () => {}
          }
        }
        let match

        while ((match = queryRegex.exec(text)) !== null) {
          const end = match.index + match[0].length - 1
          const endPos = model.getPositionAt(end)
          const inspectionPos = new monaco.Position(
            endPos.lineNumber - 1,
            endPos.column
          )
          const inspectionOff = model.getOffsetAt(inspectionPos)

          if (cancellationToken.isCancellationRequested) {
            return {
              hints: [],
              dispose: () => {}
            }
          }

          const hint: ts.QuickInfo | undefined =
            await worker.getQuickInfoAtPosition(
              `file://${model.uri.path}`,
              inspectionOff
            )

          if (!hint || !hint.displayParts) {
            continue
          }

          // Make a one-liner
          let text = hint.displayParts
            .map((d) => d.text)
            .join("")
            .replace(/\\n/g, " ")
            .replace(/\/n/g, " ")
            .replace(/  /g, " ")
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")

          const inlay: monaco.languages.InlayHint = {
            kind: monaco.languages.InlayHintKind.Type,
            position: new monaco.Position(
              endPos.lineNumber,
              endPos.column + 1
            ),
            label: text,
            paddingLeft: true
          }
          results.push(inlay)
        }
        return {
          hints: results,
          dispose: () => {}
        }
      }
    }
  )
}

function setupCompletionItemProviders(monaco: MonacoApi) {
  const previousRegistrationProvider =
    monaco.languages.registerCompletionItemProvider

  monaco.languages.registerCompletionItemProvider = function (
    language: monaco.languages.LanguageSelector,
    provider: monaco.languages.CompletionItemProvider
  ): monaco.IDisposable {
    // If the model's language is not TypeScript, there is no need to use the
    // custom completion item provider
    if (language !== "typescript") {
      return previousRegistrationProvider(language, provider)
    }

    // Implementation adapted from https://github.com/microsoft/monaco-editor/blob/a845ff6b278c76183a9cf969260fc3e1396b2b0b/src/language/typescript/languageFeatures.ts#L435
    async function provideCompletionItems(
      this: monaco.languages.CompletionItemProvider,
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _context: monaco.languages.CompletionContext,
      _token: monaco.CancellationToken
    ) {
      // Hack required for converting a `ts.TextChange` to a `ts.TextEdit` - see
      // toTextEdit function defined below
      ;(this as any).__model = model

      const wordInfo = model.getWordUntilPosition(position)
      const wordRange = new monaco.Range(
        position.lineNumber,
        wordInfo.startColumn,
        position.lineNumber,
        wordInfo.endColumn
      )
      const resource = model.uri
      const offset = model.getOffsetAt(position)

      const worker = await (this as any)._worker(resource)

      if (model.isDisposed()) {
        return
      }

      const info: ts.CompletionInfo | undefined =
        await worker.getCompletionsAtPosition(
          resource.toString(),
          offset,
          {}
        )

      if (!info || model.isDisposed()) {
        return
      }

      const suggestions = info.entries
        .filter(pruneNodeBuiltIns)
        .map((entry) => {
          let range = wordRange
          if (entry.replacementSpan) {
            const p1 = model.getPositionAt(entry.replacementSpan.start)
            const p2 = model.getPositionAt(
              entry.replacementSpan.start + entry.replacementSpan.length
            )
            range = new monaco.Range(
              p1.lineNumber,
              p1.column,
              p2.lineNumber,
              p2.column
            )
          }

          const tags: Array<monaco.languages.CompletionItemTag> = []
          if (entry.kindModifiers?.indexOf("deprecated") !== -1) {
            tags.push(monaco.languages.CompletionItemTag.Deprecated)
          }

          return {
            uri: resource,
            position,
            offset,
            range,
            label: entry.name,
            insertText: entry.name,
            sortText: entry.sortText,
            kind: (this.constructor as any).convertKind(entry.kind),
            tags,
            data: entry.data,
            hasAction: entry.hasAction,
            source: entry.source
          }
        })

      return { suggestions }
    }

    interface CustomCompletionItem
      extends monaco.languages.CompletionItem {
      readonly label: string
      readonly uri: monaco.Uri
      readonly position: monaco.Position
      readonly offset: number
      readonly source: string | undefined
      readonly data?: ts.CompletionEntryData | undefined
    }

    async function resolveCompletionItem(
      this: monaco.languages.CompletionItemProvider,
      item: CustomCompletionItem,
      _token: monaco.CancellationToken
    ) {
      const worker = await (this as any)._worker(item.uri)

      const details: ts.CompletionEntryDetails | undefined =
        await worker.getCompletionEntryDetails(
          item.uri.toString(),
          item.offset,
          item.label,
          {},
          item.source,
          {},
          item.data
        )

      if (!details) {
        return item
      }

      const autoImports = getAutoImports(this, details)

      return {
        uri: item.uri,
        position: item.position,
        label: details.name,
        kind: (this.constructor as any).convertKind(details.kind),
        detail:
          autoImports?.detailText ||
          displayPartsToString(details.displayParts),
        additionalTextEdits: autoImports?.textEdits,
        documentation: {
          value: (this.constructor as any).createDocumentationString(
            details
          )
        }
      } as CustomCompletionItem
    }

    return previousRegistrationProvider(language, {
      triggerCharacters: [".", '"', "'", "`", "/", "@", "<", "#", " "],
      provideCompletionItems: provideCompletionItems.bind(provider),
      resolveCompletionItem: resolveCompletionItem.bind(provider)
    })
  }
}

function displayPartsToString(
  displayParts: Array<ts.SymbolDisplayPart> | undefined
): string {
  if (displayParts) {
    return displayParts.map((displayPart) => displayPart.text).join("")
  }
  return ""
}

interface AutoImport {
  readonly detailText: string
  readonly textEdits: ReadonlyArray<monaco.languages.TextEdit>
}

function getAutoImports(
  provider: monaco.languages.CompletionItemProvider,
  details: ts.CompletionEntryDetails
): AutoImport | undefined {
  const codeAction = details.codeActions?.[0]
  if (!codeAction) {
    return
  }

  const changes = codeAction.changes[0]
  if (!changes) {
    return
  }
  const { textChanges } = changes

  // If the newly entered text does not start with `import ...`, then it will be
  // potentially added to an existing import and can most likely be accepted
  // without modification
  if (
    textChanges.every((textChange) => !/import/.test(textChange.newText))
  ) {
    const specifier =
      codeAction.description.match(/from ["'](.+)["']/)![1]
    return {
      detailText: `Auto import from '${specifier}'`,
      textEdits: textChanges.map((textChange) =>
        toTextEdit(provider, textChange)
      )
    }
  }

  if (details.kind === "interface" || details.kind === "type") {
    const specifier = codeAction.description.match(
      /from module ["'](.+)["']/
    )![1]
    return {
      detailText: `Auto import from '${specifier}'`,
      textEdits: textChanges.map((textChange) =>
        toTextEdit(provider, {
          ...textChange,
          // Make type-related **new** imports safe since the resolved specifier
          // might be internal and we don't have an easy way to remap it to a
          // more public one that we actually allow when we load the code at
          // runtime. This should work out of the box with `isolatedModules: true`
          // but for some reason it does not
          newText: textChange.newText.replace(/import/, "import type")
        })
      )
    }
  }

  return {
    detailText: codeAction.description,
    textEdits: textChanges.map((textChange: any) =>
      toTextEdit(provider, textChange)
    )
  }
}

function toTextEdit(
  provider: monaco.languages.CompletionItemProvider,
  textChange: ts.TextChange
): monaco.languages.TextEdit {
  return {
    // If there is no existing import in the file then a new import has to be
    // created. In such situations, TypeScript may fail to compute the proper
    // module specifier for this "node_module" because it exits its
    // `tryGetModuleNameAsNodeModule` when it doesn't have fs layer installed:
    // https://github.com/microsoft/TypeScript/blob/328e888a9d0a11952f4ff949848d4336bce91b18/src/compiler/moduleSpecifiers.ts#L553.
    // It then generates a relative path which we just hack around here
    text: textChange.newText,
    range: (provider as any)._textSpanToRange(
      (provider as any).__model,
      textChange.span
    )
  }
}

// in node repl:
// > require("module").builtinModules
const builtInNodeModules = [
  "assert",
  "assert/strict",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "dns/promises",
  "domain",
  "events",
  "fs",
  "fs/promises",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "path/posix",
  "path/win32",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "readline/promises",
  "repl",
  "stream",
  "stream/consumers",
  "stream/promises",
  "stream/web",
  "string_decoder",
  "sys",
  "timers",
  "timers/promises",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "util/types",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib"
]

function pruneNodeBuiltIns(entry: ts.CompletionEntry): boolean {
  return !builtInNodeModules.includes(entry.name)
}
