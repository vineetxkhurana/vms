/** Flat delivery fee in paise (₹100) */
export const DELIVERY_PAISE = 10_000

/** GST rate applied on subtotal */
export const GST_RATE = 0.05

/** Calculate order totals from subtotal in paise */
export function calcTotals(subtotalPaise: number) {
  const gst      = Math.round(subtotalPaise * GST_RATE)
  const delivery = DELIVERY_PAISE
  const total    = subtotalPaise + gst + delivery
  return { subtotal: subtotalPaise, gst, delivery, total }
}
