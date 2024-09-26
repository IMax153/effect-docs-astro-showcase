import { Effect } from "effect"

const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))

// Older usage with an adapter for proper type inference
const programWithAdapter = Effect.gen(function* (_ /* <-- Adapter */) {
  const transactionAmount = yield* _(fetchTransactionAmount)
})

// Current usage without an adapter
const program = Effect.gen(function* () {
  const transactionAmount = yield* fetchTransactionAmount
})
