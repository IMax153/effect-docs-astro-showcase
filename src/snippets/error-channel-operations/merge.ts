import { Effect } from "effect"

const simulatedTask = Effect.fail("Oh uh!").pipe(Effect.as(2))

const merged = Effect.merge(simulatedTask)
