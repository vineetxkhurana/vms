/** Quantity thresholds for automatic price tier upgrades */
export const RETAILER_QTY_THRESHOLD = 6    // 6+ units → retailer price
export const WHOLESALER_QTY_THRESHOLD = 21 // 21+ units → wholesaler price

/** Delivery charge tiers (in paise) based on order subtotal */
export const DELIVERY_FREE_THRESHOLD_PAISE = 50_000 // ₹500+ → free
export const DELIVERY_TIERS = [
  { maxSubtotal: 10_000, fee: 4_000 },  // up to ₹100 → ₹40
  { maxSubtotal: 25_000, fee: 3_000 },  // up to ₹250 → ₹30
  { maxSubtotal: 50_000, fee: 2_000 },  // up to ₹500 → ₹20
] as const

/** Calculate order totals from subtotal in paise */
export function calcTotals(subtotalPaise: number) {
  let delivery = 0
  if (subtotalPaise < DELIVERY_FREE_THRESHOLD_PAISE) {
    const tier = DELIVERY_TIERS.find(t => subtotalPaise <= t.maxSubtotal)
    delivery = tier?.fee ?? DELIVERY_TIERS[DELIVERY_TIERS.length - 1].fee
  }
  const total = subtotalPaise + delivery
  return { subtotal: subtotalPaise, delivery, total }
}
