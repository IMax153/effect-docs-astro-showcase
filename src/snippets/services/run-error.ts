import { Effect, Context } from "effect"

class Random extends Context.Tag("MyRandomService")<
  Random,
  { readonly next: Effect.Effect<number> }
>() {}

const program = Effect.gen(function* () {
  const random = yield* Random
  const randomNumber = yield* random.next
  console.log(`random number: ${randomNumber}`)
})

// @ts-expect-error
Effect.runSync(program)
/*
Argument of type 'Effect<void, never, Random>' is not assignable to parameter of type 'Effect<void, never, never>'.
  Type 'Random' is not assignable to type 'never'.ts(2345)
*/
