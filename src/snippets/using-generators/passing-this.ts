import { Effect } from "effect"

class MyService {
  readonly local = 1
  compute = Effect.gen(this, function* () {
    return yield* Effect.succeed(this.local + 1)
  })
}

console.log(Effect.runSync(new MyService().compute)) // Output: 2
