import { Effect, Console } from "effect"

const task: Effect.Effect<number, Error> = Effect.die("Uh oh!")

const program = Effect.matchCauseEffect(task, {
  onFailure: (cause) => {
    switch (cause._tag) {
      case "Fail":
        return Console.log(`Fail: ${cause.error.message}`)
      case "Die":
        return Console.log(`Die: ${cause.defect}`)
      case "Interrupt":
        return Console.log(`${cause.fiberId} interrupted!`)
    }
    return Console.log("failed due to other causes")
  },
  onSuccess: (value) => Console.log(`succeeded with ${value} value`)
})

Effect.runSync(program)
// Output: "Die: Uh oh!"
