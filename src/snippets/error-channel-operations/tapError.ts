import { Effect, Console } from "effect"

// Create an effect that is designed to fail, simulating an occurrence
// of a network error
const task: Effect.Effect<number, string> = Effect.fail("NetworkError")

// Log the error message if the task fails. This function only executes
// if there is an error, providing a method to handle or inspect errors
// without altering the outcome of the original effect.
const tapping = Effect.tapError(task, (error) =>
  Console.log(`expected error: ${error}`)
)

Effect.runFork(tapping)
/*
Output:
expected error: NetworkError
*/
