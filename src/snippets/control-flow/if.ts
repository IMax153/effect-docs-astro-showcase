import { Effect, Random, Console } from "effect"

const flipTheCoin = Effect.if(Random.nextBoolean, {
  onTrue: () => Console.log("Head"),
  onFalse: () => Console.log("Tail")
})

Effect.runPromise(flipTheCoin)
