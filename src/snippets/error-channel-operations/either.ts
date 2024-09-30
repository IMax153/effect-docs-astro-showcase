import { Effect, Either, Console } from "effect"

const simulatedTask = Effect.fail("Oh uh!").pipe(Effect.as(2))

const program = Effect.gen(function* () {
  const failureOrSuccess = yield* Effect.either(simulatedTask)
  if (Either.isLeft(failureOrSuccess)) {
    const error = failureOrSuccess.left
    yield* Console.log(`failure: ${error}`)
    return 0
  } else {
    const value = failureOrSuccess.right
    yield* Console.log(`success: ${value}`)
    return value
  }
})
