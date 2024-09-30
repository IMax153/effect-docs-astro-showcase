import { Effect, Context, Console } from "effect"

class Random extends Context.Tag("MyRandomService")<
  Random,
  { readonly next: Effect.Effect<number> }
>() {}

const program = Random.pipe(
  Effect.andThen((random) => random.next),
  Effect.andThen((randomNumber) =>
    Console.log(`random number: ${randomNumber}`)
  )
)
