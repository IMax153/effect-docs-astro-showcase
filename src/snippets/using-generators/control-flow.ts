import { Effect } from "effect"

const calculateTax = (
  amount: number,
  taxRate: number
): Effect.Effect<number, Error> =>
  taxRate > 0
    ? Effect.succeed((amount * taxRate) / 100)
    : Effect.fail(new Error("Invalid tax rate"))

const program = Effect.gen(function* () {
  let i = 1

  while (true) {
    if (i === 10) {
      break // Break the loop when counter reaches 10
    } else {
      if (i % 2 === 0) {
        // Calculate tax for even numbers
        console.log(yield* calculateTax(100, i))
      }
      i++
      continue
    }
  }
})

Effect.runPromise(program)
/*
Output:
2
4
6
8
*/
