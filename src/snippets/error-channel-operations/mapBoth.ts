import { Effect } from "effect"

const simulatedTask = Effect.fail("Oh no!").pipe(Effect.as(1))

const modified = Effect.mapBoth(simulatedTask, {
  onFailure: (message) => new Error(message),
  onSuccess: (n) => n > 0
})
