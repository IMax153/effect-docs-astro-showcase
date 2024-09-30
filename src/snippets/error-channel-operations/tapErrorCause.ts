import { Effect, Console } from "effect"

// Create an effect that is designed to fail, simulating an occurrence of a
// network error
const task1: Effect.Effect<number, string> = Effect.fail("NetworkError")

// This will log the cause of any expected error or defect
const tapping1 = Effect.tapErrorCause(task1, (cause) =>
  Console.log(`error cause: ${cause}`)
)

Effect.runFork(tapping1)
/*
Output:
error cause: Error: NetworkError
*/

// Simulate a severe failure in the system by causing a defect with
// a specific message.
const task2: Effect.Effect<number, string> = Effect.dieMessage(
  "Something went wrong"
)

// This will log the cause of any expected error or defect
const tapping2 = Effect.tapErrorCause(task2, (cause) =>
  Console.log(`error cause: ${cause}`)
)

Effect.runFork(tapping2)
/*
Output:
error cause: RuntimeException: Something went wrong
  ... stack trace ...
*/
