import { Effect, Either } from "effect"

const task = Effect.gen(function* () {
  console.log("Start processing...")
  yield* Effect.sleep("2 seconds") // Simulates a delay in processing
  console.log("Processing complete.")
  return "Result"
})

const program = task.pipe(
  Effect.timeoutTo({
    duration: "1 second",
    // let's return an Either
    onSuccess: (result): Either.Either<string, string> =>
      Either.right(result),
    onTimeout: (): Either.Either<string, string> =>
      Either.left("Timed out!")
  })
)

Effect.runPromise(program).then(console.log)
/*
Output:
Start processing...
{
  _id: "Either",
  _tag: "Left",
  left: "Timed out!"
}
*/
