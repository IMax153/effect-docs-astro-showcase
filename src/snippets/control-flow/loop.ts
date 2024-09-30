import { Effect } from "effect"

const result = Effect.loop(
  // Initial state
  1,
  {
    // Condition to continue looping
    while: (state) => state <= 5,
    // State update function
    step: (state) => state + 1,
    // Effect to be performed on each iteration
    body: (state) => Effect.succeed(state)
  }
)

Effect.runPromise(result).then(console.log) // Output: [1, 2, 3, 4, 5]
