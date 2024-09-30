import { Effect } from "effect"

const task = Effect.gen(function* () {
  console.log("Start processing...")
  yield* Effect.sleep("2 seconds") // Simulates a delay in processing
  console.log("Processing complete.")
  return "Result"
})

const timedOutEffect = Effect.all([
  task.pipe(Effect.timeoutOption("3 seconds")),
  task.pipe(Effect.timeoutOption("1 second"))
])

Effect.runPromise(timedOutEffect).then(console.log)
/*
Output:
Start processing...
Processing complete.
Start processing...
[
  { _id: 'Option', _tag: 'Some', value: 'Result' },
  { _id: 'Option', _tag: 'None' }
]
*/
