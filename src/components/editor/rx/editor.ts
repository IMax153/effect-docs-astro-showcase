import { Rx } from "@effect-rx/rx-react"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { Monaco } from "../services/monaco"

const runtime = Rx.runtime(Monaco.Live).pipe(
  Rx.setIdleTTL("10 seconds")
)

export const editorRx = Rx.family((_: void) => {
  const element = Rx.make(Option.none<HTMLElement>())

  const editor = runtime.rx((get) =>
    Effect.gen(function*() {
      const el = yield* get.some(element)
      const monaco = yield* Monaco
      const editor = yield* monaco.makeEditor(el)
      return {
        ...editor
      } as const
    }))

  return {
    element, editor
  } as const
})
