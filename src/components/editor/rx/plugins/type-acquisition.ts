import * as Array from "effect/Array"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Sink from "effect/Sink"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { Monaco } from "../../services/monaco";
import { WebContainer } from "../../services/webcontainer";
import type { RxWorkspaceHandle } from "../workspace";

export function typeAcquisitionPlugin(handle: RxWorkspaceHandle) {
  return Effect.gen(function*() {
    const { monaco } = yield* Monaco
    const container = yield* WebContainer
    const workspace = yield* SubscriptionRef.get(handle.workspaceRef)

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
                return container.readFile(workspace.relativePath(fullPath)).pipe(
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
      return container.readFile(workspace.relativePath(`${modulePath}/package.json`)).pipe(
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

    const [initial, updates] = yield* pipe(
      container.watchFile(workspace.relativePath("package.json")),
      Stream.peel(Sink.head())
    )
    if (Option.isNone(initial)) {
      return
    }

    // Perform initial registration of dependencies
    yield* acquireTypes(initial.value)

    // Handle updates to the `package.json` dependencies (i.e. from a user
    // running `pnpm install <package>`)
    yield* pipe(
      updates,
      Stream.runForEach(acquireTypes),
      Effect.forkScoped
    )
  })
}

