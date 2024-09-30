import { Effect } from "effect"

const program = Effect.forEach([1, 2, 3, 4, 5], (n) => {
  if (n < 4) {
    return Effect.succeed(n)
  } else {
    return Effect.fail(`${n} is not less that 4`)
  }
})

Effect.runPromise(program).then(console.log, console.error)
/*
Output:
(FiberFailure) Error: 4 is not less that 4
*/
