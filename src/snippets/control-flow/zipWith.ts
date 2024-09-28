import { Effect } from "effect"

const task1 = Effect.succeed(1).pipe(
  Effect.delay("200 millis"),
  Effect.tap(Effect.log("task1 done"))
)
const task2 = Effect.succeed("hello").pipe(
  Effect.delay("100 millis"),
  Effect.tap(Effect.log("task2 done"))
)

const task3 = Effect.zipWith(
  task1,
  task2,
  (number, string) => number + string.length
)

Effect.runPromise(task3).then(console.log)
/*
Output:
timestamp=... level=INFO fiber=#3 message="task1 done"
timestamp=... level=INFO fiber=#2 message="task2 done"
6
*/
