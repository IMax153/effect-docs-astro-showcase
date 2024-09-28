import { pipe, Effect } from "effect"

// Function to add a small service charge to a transaction amount
const addServiceCharge = (amount: number) => amount + 1

// Simulated asynchronous task to fetch a transaction amount from a database
const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))

// Apply service charge to the transaction amount
const finalAmount = pipe(
  fetchTransactionAmount,
  Effect.map(addServiceCharge)
)

Effect.runPromise(finalAmount).then(console.log) // Output: 101
