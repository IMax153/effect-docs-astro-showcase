import { pipe, Effect, Array } from "effect"

const flattened = pipe(
  Effect.succeed([
    [1, 2],
    [3, 4]
  ]),
  Effect.map((nested) => Array.flatten(nested))
)
