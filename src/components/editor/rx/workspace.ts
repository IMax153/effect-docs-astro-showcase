import { Rx } from "@effect-rx/rx-react"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Stream from "effect/Stream"
import * as SubscriptionRef from "effect/SubscriptionRef"
import { themeRx } from "@/rx/theme"
import type { Workspace, WorkspaceShell } from "../domain/workspace"
import { MonokaiSodaTheme, NightOwlishLightTheme, Terminal } from "../services/terminal"
import { WebContainer } from "../services/webcontainer"

export interface RxWorkspaceHandle
  extends Rx.Rx.InferSuccess<ReturnType<typeof workspaceHandleRx>> { }

const runtime = Rx.runtime(Layer.mergeAll(
  Terminal.Live,
  WebContainer.Live
))

const terminalThemeRx = themeRx.pipe(
  Rx.map((theme) => theme === "light" ? NightOwlishLightTheme : MonokaiSodaTheme)
)

export const workspaceHandleRx = Rx.family((workspace: Workspace) =>
  runtime.rx(
    Effect.gen(function*() {
      const container = yield* WebContainer
      const terminal = yield* Terminal

      const workspaceRef = yield* SubscriptionRef.make(workspace)
      const workspaceReady = yield* Deferred.make<void>()

      let size = 0
      const terminalSize = Rx.writable(
        () => size,
        (ctx, _: void) => ctx.setSelf(size++)
      ).pipe(Rx.debounce("250 millis"))

      const makeTerminal = Rx.family((workspaceShell: WorkspaceShell) =>
        Rx.make((get) =>
          Effect.gen(function*() {
            const shell = yield* container.makeShell
            const spawned = yield* terminal.spawn({
              theme: get.once(terminalThemeRx)
            })
            const input = shell.input.getWriter()
            const mount = Effect.sync(() => {
              shell.output.pipeTo(new WritableStream({
                write(data) {
                  spawned.terminal.write(data)
                }
              }))
              spawned.terminal.onData((data) => {
                input.write(data)
              })
            })
            spawned.terminal.write("Loading workspace...\n")
            yield* Effect.gen(function*() {
              input.write(`cd "${workspace.name}" && clear\n`)
              yield* Deferred.await(workspaceReady)
              if (workspaceShell.command !== undefined) {
                yield* Effect.sleep("3 seconds")
                yield* mount
                input.write(`${workspaceShell.command}\n`)
              } else {
                yield* mount
              }
            }).pipe(Effect.forkScoped)
            get.subscribe(terminalThemeRx, (theme) => {
              spawned.terminal.options.theme = theme
            })
            get.stream(terminalSize).pipe(
              Stream.runForEach(() => spawned.resize),
              Effect.forkScoped
            )
            return spawned.terminal
          })
        )
      )

      return {
        selectedFile: Rx.make(workspace.initialFile),
        makeTerminal,
        terminalSize,
        workspace: Rx.subscriptionRef(workspaceRef),
        workspaceRef,
        workspaceReady
      } as const
    })
  )
)
