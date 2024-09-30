import { Effect } from "effect"

const simulatedTask = Effect.fail("Oh no!").pipe(Effect.as(1))

const mapped = Effect.mapError(
  simulatedTask,
  (message) => new Error(message)
)
