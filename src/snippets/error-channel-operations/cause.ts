import { Effect, Console } from "effect"

const simulatedTask = Effect.fail("Oh uh!").pipe(Effect.as(2))

const program = Effect.gen(function* () {
  const cause = yield* Effect.cause(simulatedTask)
  yield* Console.log(cause)
})
