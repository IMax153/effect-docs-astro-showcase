import { Effect } from "effect"

const task = Effect.gen(function* () {
  console.log("Start processing...")
  yield* Effect.sleep("2 seconds") // Simulates a delay in processing
  console.log("Processing complete.")
  return "Result"
})

const timedEffect = task.pipe(
  Effect.uninterruptible,
  Effect.timeout("1 second")
)

// Outputs a TimeoutException after the task completes,
// because the task is uninterruptible
Effect.runPromiseExit(timedEffect).then(console.log)
/*
Output:
Start processing...
Processing complete.
{
  _id: 'Exit',
  _tag: 'Failure',
  cause: {
    _id: 'Cause',
    _tag: 'Fail',
    failure: { _tag: 'TimeoutException' }
  }
}
*/
