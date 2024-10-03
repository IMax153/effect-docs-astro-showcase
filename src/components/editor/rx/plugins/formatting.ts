import { createStreaming, type Formatter } from "@dprint/formatter"
import * as Cache from "effect/Cache"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { pipe } from "effect/Function"
import * as Record from "effect/Record"
import * as Sink from "effect/Sink"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { Toaster } from "@/services/toaster"
import { WebContainer } from "../../services/webcontainer"
import { Monaco } from "../../services/monaco"
import type { RxWorkspaceHandle } from "../workspace"

export interface FormatterPlugin {
  readonly language: string
  readonly formatter: Formatter
}

export function formattingPlugin(handle: RxWorkspaceHandle) {
  return Effect.gen(function*() {
    const { monaco } = yield* Monaco
    const { toast } = yield* Toaster
    const container = yield* WebContainer

    yield* Effect.sync(() => {
      monaco.editor.addEditorAction({
        id: "format",
        label: "Format",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: (editor) => {
          const action = editor.getAction("editor.action.formatDocument")
          if (action) {
            action.run()
          }
        }
      })
    })

    const formatters = new Map<string, Formatter>()

    const pluginCache = yield* Cache.make({
      capacity: 10,
      timeToLive: Number.MAX_SAFE_INTEGER,
      lookup: (plugin: string) => loadPlugin(plugin)
    })

    const LANGUAGE_REGEX =
      /^\/vendor\/dprint\/plugins\/([a-zA-Z0-9_-]+)-.*\.wasm$/

    function extractLanguage(input: string) {
      const match = input.match(LANGUAGE_REGEX)
      return match ? match[1] : null
    }

    function loadPlugin(plugin: string): Effect.Effect<FormatterPlugin> {
      return Effect.all({
        language: Effect.fromNullable(extractLanguage(plugin)),
        formatter: Effect.promise(() => createStreaming(fetch(plugin)))
      }).pipe(Effect.orDie)
    }

    function loadPlugins(plugins: Array<string>) {
      return Effect.forEach(plugins, (plugin) => pluginCache.get(plugin), {
        concurrency: plugins.length
      })
    }

    function installPlugins(plugins: Array<FormatterPlugin>) {
      return Effect.forEach(
        plugins,
        ({ language, formatter }) =>
          Effect.sync(() => {
            monaco.languages.registerDocumentFormattingEditProvider(language, {
              provideDocumentFormattingEdits(model) {
                return [
                  {
                    text: formatter.formatText({
                      filePath: model.uri.toString(),
                      fileText: model.getValue()
                    }),
                    range: model.getFullModelRange()
                  }
                ]
              }
            })
          }),
        { concurrency: plugins.length, discard: true }
      )
    }

    function setLanguageConfig(language: string, config: any) {
      const formatter = formatters.get(language)
      if (formatter) {
        formatter.setConfig({}, config)
      }
    }

    const parseJson = Option.liftThrowable(JSON.parse)

    function configurePlugin(config: string) {
      return parseJson(config).pipe(
        Effect.flatMap((json) =>
          Effect.sync(() => {
            const { plugins, ...rest } = json
            return Record.toEntries(rest).forEach(([language, config]) => {
              setLanguageConfig(language, config)
            })
          })
        ),
        Effect.ignore
      )
    }

    const workspace = yield* SubscriptionRef.get(handle.workspaceRef)
    const configFile = workspace.findFile("dprint.json")
    if (Option.isNone(configFile)) {
      return
    }

    yield* parseJson(configFile.value[0].initialContent).pipe(
      Effect.flatMap((json) => loadPlugins(json.plugins as Array<string>)),
      Effect.tap((plugins) => installPlugins(plugins)),
      Effect.map((plugins) =>
        plugins.forEach(({ language, formatter }) => {
          formatters.set(language, formatter)
        })
      ),
      Effect.ignoreLogged
    )

    const [initial, updates] = yield* pipe(
      container.watchFile(workspace.relativePath("dprint.json")),
      Stream.peel(Sink.head())
    )
    if (Option.isNone(initial)) {
      return
    }

    // Perform initial plugin configuration
    yield* configurePlugin(initial.value)

    // Handle updates to plugin configuration
    yield* updates.pipe(
      Stream.tap(() =>
        toast({
          title: "Effect Playground",
          description: "Updated formatter settings!"
        })
      ),
      Stream.runForEach(configurePlugin),
      Effect.forkScoped
    )
  })
}

