import { Effect, Schedule, Console } from "effect"
import { task } from "./simulation"

const policy = Schedule.addDelay(
  // Retry for a maximum of 2 times
  Schedule.recurs(2),
  // Add a delay of 100 milliseconds between retries
  () => "100 millis"
)

// Create a new effect that retries the effect with the specified policy,
// and provides a fallback effect if all retries fail
const repeated = Effect.retryOrElse(task, policy, () =>
  Console.log("orElse").pipe(Effect.as("default value"))
)

Effect.runPromise(repeated).then(console.log)
/*
Output:
failure
failure
failure
orElse
default value
*/
