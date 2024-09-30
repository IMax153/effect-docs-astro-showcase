import { Effect, Random, Console } from "effect"

// Simulate an effect that might fail
const task = Effect.filterOrFail(
  Random.nextRange(-1, 1),
  (n) => n >= 0,
  () => "random number is negative"
)

// Define an effect that logs both success and failure outcomes
// of the task
const tapping = Effect.tapBoth(task, {
  onFailure: (error) => Console.log(`failure: ${error}`),
  onSuccess: (randomNumber) => Console.log(`random number: ${randomNumber}`)
})

Effect.runFork(tapping)
/*
Example Output:
failure: random number is negative
*/
