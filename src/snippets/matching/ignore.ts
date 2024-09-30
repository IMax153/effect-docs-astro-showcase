import { Effect } from "effect"

const task = Effect.fail("Uh oh!").pipe(Effect.as(5))

const program = Effect.ignore(task)
