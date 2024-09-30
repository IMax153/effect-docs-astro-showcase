import { Effect, Console } from "effect"

class NetworkError {
  readonly _tag = "NetworkError"
  constructor(readonly statusCode: number) {}
}

class ValidationError {
  readonly _tag = "ValidationError"
  constructor(readonly field: string) {}
}

// Create an effect that is designed to fail, simulating an
// occurrence of a network error
const task: Effect.Effect<number, NetworkError | ValidationError> =
  Effect.fail(new NetworkError(504))

// Apply an error handling function only to errors tagged as
// "NetworkError", and log the corresponding status code of the error.
const tapping = Effect.tapErrorTag(task, "NetworkError", (error) =>
  Console.log(`expected error: ${error.statusCode}`)
)

Effect.runFork(tapping)
/*
Output:
expected error: 504
*/
