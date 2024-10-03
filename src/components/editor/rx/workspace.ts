import { Rx } from "@effect-rx/rx-react"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { Workspace, WorkspaceShell } from "../domain/workspace"
import { MonokaiSodaTheme, NightOwlishLightTheme, Terminal } from "../services/terminal"
import { WebContainer } from "../services/webcontainer"
import { themeRx } from "@/rx/theme"
import { Stream } from "effect"

const runtime = Rx.runtime(Layer.mergeAll(
  Terminal.Live,
  WebContainer.Live
))

const terminalTheme = Rx.map(themeRx, (theme) =>
  theme === "light" ? NightOwlishLightTheme : MonokaiSodaTheme
)

export interface RxWorkspaceHandle
  extends Rx.Rx.InferSuccess<ReturnType<typeof workspaceHandleRx>> { }

export const workspaceHandleRx = Rx.family((workspace: Workspace) =>
  runtime.rx((get) => Effect.gen(function*() {
    const handle = yield* WebContainer.setupWorkspace(workspace)
    const { spawn } = yield* Terminal

    const selectedFile = Rx.make(workspace.initialFile)

    let size = 0
    const terminalSize = Rx.writable(
      () => size,
      (ctx) => ctx.setSelf(size++)
    ).pipe(Rx.debounce("250 millis"))

    const terminal = Rx.family((env: WorkspaceShell) =>
      Rx.make((get) => Effect.gen(function*() {
        const shell = yield* handle.makeShell
        const { terminal, resize } = yield* spawn({
          theme: get.once(terminalTheme)
        })
        const input = shell.input.getWriter()
        const mount = Effect.sync(() => {
          shell.output.pipeTo(new WritableStream({
            write(data) {
              terminal.write(data)
            }
          }))
          terminal.onData((data) => {
            input.write(data)
          })
        })
        terminal.write("Loading workspace...\n")
        yield* Effect.gen(function*() {
          input.write(`cd "${workspace.name}" && clear\n`)
          if (env.command) {
            yield* Effect.sleep(3000)
            yield* mount
            input.write(`${env.command}\n`)
          } else {
            yield* mount
          }
        }).pipe(Effect.forkScoped)
        get.subscribe(terminalTheme, (theme) => {
          terminal.options.theme = theme
        })
        get.stream(terminalSize).pipe(
          Stream.runForEach(() => resize),
          Effect.forkScoped
        )
        return terminal
      }).pipe(Effect.annotateLogs({ rx: "terminalRx" }))))


    return {
      handle,
      terminal,
      terminalSize,
      selectedFile,
      workspace: Rx.subscriptionRef(handle.workspace),
    } as const
  }).pipe(Effect.annotateLogs({
    workspace: workspace.name,
    rx: "workspaceHandleRx"
  }))).pipe(Rx.setIdleTTL("10 seconds"))
)
