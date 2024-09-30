import { Effect } from "effect"

const task = Effect.gen(function* () {
  console.log("Start processing...")
  yield* Effect.sleep("2 seconds") // Simulates a delay in processing
  console.log("Processing complete.")
  return "Result"
})

class MyTimeoutError {
  readonly _tag = "MyTimeoutError"
}

const program = task.pipe(
  Effect.timeoutFail({
    duration: "1 second",
    onTimeout: () => new MyTimeoutError()
  })
)

Effect.runPromiseExit(program).then(console.log)
/*
Output:
Start processing...
{
  _id: 'Exit',
  _tag: 'Failure',
  cause: {
    _id: 'Cause',
    _tag: 'Fail',
    failure: MyTimeoutError { _tag: 'MyTimeoutError' }
  }
}
*/
