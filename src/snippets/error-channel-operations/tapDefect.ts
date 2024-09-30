import { Effect, Console } from "effect"

// Create an effect that is designed to fail, simulating an occurrence of a
// network error
const task1: Effect.Effect<number, string> = Effect.fail("NetworkError")

// this won't log anything because is not a defect
const tapping1 = Effect.tapDefect(task1, (cause) =>
  Console.log(`defect: ${cause}`)
)

Effect.runFork(tapping1)
/*
No Output
*/

// Simulate a severe failure in the system by causing a defect with
// a specific message.
const task2: Effect.Effect<number, string> = Effect.dieMessage(
  "Something went wrong"
)

// This will only log defects, not errors
const tapping2 = Effect.tapDefect(task2, (cause) =>
  Console.log(`defect: ${cause}`)
)

Effect.runFork(tapping2)
/*
Output:
defect: RuntimeException: Something went wrong
  ... stack trace ...
*/
