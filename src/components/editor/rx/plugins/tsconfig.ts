import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as Sink from "effect/Sink"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { Toaster } from "@/services/toaster"
import type { RxWorkspaceHandle } from "../workspace"
import { Monaco } from "../../services/monaco"
import { WebContainer } from "../../services/webcontainer"

export function tsconfigPlugin(handle: RxWorkspaceHandle) {
  return Effect.gen(function*() {
    const { monaco } = yield* Monaco
    const { toast } = yield* Toaster
    const container = yield* WebContainer

    const parseJson = Option.liftThrowable(JSON.parse)

    function configureTypeScript(config: string) {
      return parseJson(config).pipe(
        Effect.flatMap((json) =>
          Effect.suspend(() => {
            const ts = (window as any).ts
            const cfg = ts.convertCompilerOptionsFromJson(
              json.compilerOptions,
              ""
            )
            if (cfg.errors.length > 0) {
              const message = cfg.errors
                .map((diagnostic: any) => diagnostic.messageText)
                .join("\n")
              return Console.error(message)
            }
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
              ...cfg.options,
              allowNonTsExtensions: true
            })
            return Effect.void
          })
        ),
        Effect.ignore
      )
    }

    const workspace = yield* SubscriptionRef.get(handle.workspaceRef)
    const [initial, updates] = yield* pipe(
      container.watchFile(workspace.relativePath("tsconfig.json")),
      Stream.peel(Sink.head())
    )
    if (Option.isNone(initial)) {
      return
    }

    // Perform initial plugin configuration
    yield* configureTypeScript(initial.value)

    // Handle updates to plugin configuration
    yield* pipe(
      updates,
      Stream.tap(() =>
        toast({
          title: "Effect Playground",
          description: "Updated TypeScript configuration!"
        })
      ),
      Stream.runForEach(configureTypeScript),
      Effect.forkScoped,
      Effect.ignoreLogged
    )
  })
}
