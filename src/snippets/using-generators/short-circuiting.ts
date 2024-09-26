import { Effect } from "effect"

const program = Effect.gen(function* () {
  console.log("Task1...")
  console.log("Task2...")
  yield* Effect.fail("Something went wrong!")
  console.log("This won't be executed")
})

Effect.runPromise(program).then(console.log, console.error)
/*
Output:
Task1...
Task2...
(FiberFailure) Error: Something went wrong!
*/
