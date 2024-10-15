import { Rx } from "@effect-rx/rx-react"
import * as monaco from "@effect/monaco-editor"
import { createStreaming, type Formatter } from "@dprint/formatter"
import * as Array from "effect/Array"
import * as Cache from "effect/Cache"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Schedule from "effect/Schedule"
import * as Sink from "effect/Sink"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { themeRx } from "@/rx/theme"
import { Toaster } from "@/services/toaster"
import { File, FullPath, Workspace } from "../domain/workspace"
import { Loader } from "../services/loader"
import { Monaco } from "../services/monaco"
import { WebContainer } from "../services/webcontainer"
import type { RxWorkspaceHandle } from "./workspace"

export const editorThemeRx = Rx.map(themeRx, (theme) =>
  theme === "dark" ? "dracula" : "vs"
)

const runtime = Rx.runtime(Layer.mergeAll(
  Loader.Default,
  Monaco.Default,
  Toaster.Default,
  WebContainer.Default
)).pipe(Rx.setIdleTTL("10 seconds"))

export const editorRx = Rx.family((handle: RxWorkspaceHandle) => {
  const element = Rx.make(Option.none<HTMLElement>())

  const editor = runtime.rx((get) =>
    Effect.gen(function*() {
      const loader = yield* Loader
      const monaco = yield* Monaco
      const container = yield* WebContainer

      const el = yield* get.some(element)
      const editor = yield* monaco.createEditor(el)

      /**
       * Syncs the website theme with the editor.
       */
      get.subscribe(
        editorThemeRx,
        (theme) => editor.editor.updateOptions({ theme }),
        { immediate: true }
      )

      /**
       * Syncs the content of the editor with the underlying WebContainer file
       * system.
       */
      function sync(fullPath: FullPath, file: File) {
        return container.readFile(fullPath).pipe(
          Stream.tap((model) => editor.loadModel(model)),
          Stream.flatMap(() => editor.content.pipe(Stream.drop(1)), { switch: true }),
          Stream.debounce("2 seconds"),
          Stream.tap((content) => container.writeFile(fullPath, content, file.language)),
          Stream.ensuring(Effect.suspend(() => {
            const content = editor.editor.getValue()
            if (content.trim().length === 0) {
              return Effect.void
            }
            return container.writeFile(fullPath, content, file.language)
          }))
        )
      }

      /**
       * Loads the file system of a workspace into the WebContainer file system.
       */
      function loadWorkspace(workspace: Workspace) {
        return Effect.forEach(workspace.filePaths, ([file, path]) => {
          const fullPath = workspace.relativePath(path)
          if (file._tag === "Directory") {
            return container.makeDirectory(fullPath).pipe(
              Effect.catchTag("FileAlreadyExistsError", () => Effect.void)
            )
          }
          return container.writeFile(fullPath, file.initialContent, file.language)
        }, { discard: true })
      }

      const workspace = yield* SubscriptionRef.get(handle.workspace)
      yield* loadWorkspace(workspace).pipe(
        loader.withIndicator("Preparing workspace", "1 seconds")
      )
      yield* handle.run("pnpm install").pipe(
        Effect.zipRight(setupWorkspaceTypeAcquisition(workspace)),
        Effect.zipRight(setupWorkspaceFormatters(workspace)),
        loader.withIndicator("Installing dependencies", "3 seconds"),
      )

      // Ensure the editor UI reflects changes to the selected workspace file
      yield* loader.withIndicator("Configuring editor", "2 seconds")(Effect.void)
      yield* get.stream(handle.selectedFile).pipe(
        Stream.bindTo("file"),
        Stream.bindEffect("workspace", () => SubscriptionRef.get(handle.workspace)),
        Stream.bindEffect("fullPath", ({ file, workspace }) => workspace.fullPathTo(file)),
        Stream.flatMap(({ file, fullPath }) => sync(fullPath, file), { switch: true }),
        Stream.runDrain,
        Effect.retry(Schedule.spaced("200 millis")),
        Effect.forkScoped
      )

      yield* loader.finish

      return {
        ...editor
      } as const
    })
  )

  return {
    element,
    editor
  } as const
})

function setupWorkspaceTypeAcquisition(workspace: Workspace) {
  return Effect.gen(function*() {
    const container = yield* WebContainer

    const parseJson = Option.liftThrowable(JSON.parse)

    function addExtraLib(path: string, content: string) {
      return Effect.sync(() => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, `file://${path}`)
      })
    }

    function acquirePackageTypes(pkg: string) {
      function walkDts(path: string): Effect.Effect<void> {
        return container.readDirectory(workspace.relativePath(path)).pipe(
          Effect.map((entries) => Array.partitionMap(entries, (entry) =>
            entry.isDirectory() ? Either.left(entry.name) : Either.right(entry.name)
          )),
          Effect.tap(([, files]) =>
            Effect.forEach(files, (file) => {
              if (file.endsWith(".d.ts")) {
                const fullPath = `${path}/${file}`
                return container.readFileString(workspace.relativePath(fullPath)).pipe(
                  Effect.flatMap((content) => addExtraLib(fullPath, content))
                )
              }
              return Effect.void
            }, { concurrency: files.length, discard: true })
          ),
          Effect.flatMap(([directories]) =>
            Effect.forEach(
              directories,
              (directory) => walkDts(`${path}/${directory}`),
              { concurrency: directories.length, discard: true }
            )
          ),
          Effect.ignoreLogged
        )
      }
      const modulePath = `/node_modules/${pkg}`
      return container.readFileString(workspace.relativePath(`${modulePath}/package.json`)).pipe(
        Effect.flatMap((content) => addExtraLib(`${modulePath}/package.json`, content)),
        Effect.zipRight(walkDts(modulePath))
      )
    }

    function acquireTypes(packageJson: string) {
      return parseJson(packageJson).pipe(
        Effect.map((packageJson) => Object.keys(packageJson.dependencies)),
        Effect.map(Array.filter((dep) => !["typescript", "tsc-watch"].includes(dep))),
        Effect.zipLeft(addExtraLib("/package.json", packageJson)),
        Effect.flatMap((packages) =>
          Effect.forEach(
            packages,
            (pkg) => acquirePackageTypes(pkg),
            { concurrency: packages.length, discard: true }
          )
        )
      )
    }

    const packageJson = workspace.findFile("package.json")
    if (Option.isNone(packageJson)) {
      return
    }

    const path = yield* Effect.orDie(workspace.fullPathTo(packageJson.value[0]))
    const [initial, updates] = yield* container.watchFile(path).pipe(
      Stream.peel(Sink.head())
    )
    if (Option.isNone(initial)) {
      return
    }

    // Perform initial registration of dependencies
    yield* acquireTypes(initial.value)

    // Handle updates to the `package.json` dependencies (i.e. from a user
    // running `pnpm install <package>`)
    yield* updates.pipe(
      Stream.runForEach(acquireTypes),
      Effect.forkScoped
    )
  })
}

interface FormatterPlugin {
  readonly language: string
  readonly formatter: Formatter
}

function setupWorkspaceFormatters(workspace: Workspace) {
  return Effect.gen(function*() {
    const toaster = yield* Toaster
    const container = yield* WebContainer

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
                      fileText: model.getValue(),
                      filePath: model.uri.toString()
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
            return Object.entries(rest).forEach(([language, config]) => {
              setLanguageConfig(language, config)
            })
          })
        ),
        Effect.ignoreLogged
      )
    }

    const config = workspace.findFile("dprint.json")
    if (Option.isNone(config)) {
      return
    }

    yield* parseJson(config.value[0].initialContent).pipe(
      Effect.flatMap((json) => loadPlugins(json.plugins as Array<string>)),
      Effect.tap((plugins) => installPlugins(plugins)),
      Effect.map((plugins) =>
        plugins.forEach(({ language, formatter }) => {
          formatters.set(language, formatter)
        })
      ),
      Effect.ignoreLogged
    )

    const packageJson = workspace.findFile("dprint.json")
    if (Option.isNone(packageJson)) {
      return
    }

    const path = yield* Effect.orDie(workspace.fullPathTo(packageJson.value[0]))
    const [initial, updates] = yield* container.watchFile(path).pipe(
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
        toaster.toast({
          title: "Effect Playground",
          description: "Updated formatter settings!"
        })
      ),
      Stream.runForEach(configurePlugin),
      Effect.forkScoped
    )
  })
}
