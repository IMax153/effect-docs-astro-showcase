import { Effect } from "effect"

// Creating an effect that represents a failure scenario
const failure = Effect.fail(
  new Error("Operation failed due to network error")
)
