import { Effect } from "effect"

const program = Effect.gen(function* () {
  console.log("Task1...")
  console.log("Task2...")
  // Introduce an error into the flow
  yield* Effect.fail("Something went wrong!")
})

Effect.runPromiseExit(program).then(console.log)
/*
Output:
Task1...
Task2...
{
  _id: 'Exit',
  _tag: 'Failure',
  cause: { _id: 'Cause', _tag: 'Fail', failure: 'Something went wrong!' }
}
*/
