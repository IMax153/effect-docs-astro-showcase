const addServiceCharge = (amount: number) => amount + 1

const applyDiscount = (
  total: number,
  discountRate: number
): Promise<number> =>
  discountRate === 0
    ? Promise.reject(new Error("Discount rate cannot be zero"))
    : Promise.resolve(total - (total * discountRate) / 100)

const fetchTransactionAmount = Promise.resolve(100)

const fetchDiscountRate = Promise.resolve(5)

export const program = async function () {
  const transactionAmount = await fetchTransactionAmount
  const discountRate = await fetchDiscountRate
  const discountedAmount = await applyDiscount(
    transactionAmount,
    discountRate
  )
  const finalAmount = addServiceCharge(discountedAmount)
  return `Final amount to charge: ${finalAmount}`
}
