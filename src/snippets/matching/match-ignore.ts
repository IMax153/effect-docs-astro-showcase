import { Effect } from "effect"
import { constVoid } from "effect/Function"

const task = Effect.fail("Uh oh!").pipe(Effect.as(5))

const program = Effect.match(task, {
  onFailure: constVoid,
  onSuccess: constVoid
})
