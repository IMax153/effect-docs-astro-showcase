import { Effect } from "effect"

const divide = (a: number, b: number): Effect.Effect<number, Error, never> =>
  b === 0
    ? Effect.fail(new Error("Cannot divide by zero"))
    : Effect.succeed(a / b)
