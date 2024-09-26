import { Effect } from "effect"

// Function to add a small service charge to a transaction amount
const addServiceCharge = (amount: number) => amount + 1

// Function to apply a discount safely to a transaction amount
const applyDiscount = (
  total: number,
  discountRate: number
): Effect.Effect<number, Error> =>
  discountRate === 0
    ? Effect.fail(new Error("Discount rate cannot be zero"))
    : Effect.succeed(total - (total * discountRate) / 100)

// Simulated asynchronous task to fetch a transaction amount from a
// database
const fetchTransactionAmount = Effect.promise(() => Promise.resolve(100))

// Simulated asynchronous task to fetch a discount rate from a
// configuration file
const fetchDiscountRate = Effect.promise(() => Promise.resolve(5))

// Assembling the program using a generator function
const program = Effect.gen(function* () {
  // Retrieve the transaction amount
  const transactionAmount = yield* fetchTransactionAmount

  // Retrieve the discount rate
  const discountRate = yield* fetchDiscountRate

  // Calculate discounted amount
  const discountedAmount = yield* applyDiscount(
    transactionAmount,
    discountRate
  )

  // Apply service charge
  const finalAmount = addServiceCharge(discountedAmount)

  // Return the total amount after applying the charge
  return `Final amount to charge: ${finalAmount}`
})

// Execute the program and log the result
Effect.runPromise(program).then(console.log)
// Output: "Final amount to charge: 96"
