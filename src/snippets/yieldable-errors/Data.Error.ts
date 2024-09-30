import { Effect, Data } from "effect"

class MyError extends Data.Error<{ message: string }> {}

export const program = Effect.gen(function* () {
  // same as yield* Effect.fail(new MyError({ message: "Oh no!" })
  yield* new MyError({ message: "Oh no!" })
})

Effect.runPromiseExit(program).then(console.log)
/*
Output:
{
  _id: 'Exit',
  _tag: 'Failure',
  cause: { _id: 'Cause', _tag: 'Fail', failure: { message: 'Oh no!' } }
}
*/
