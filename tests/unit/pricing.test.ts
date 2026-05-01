import { describe, it, expect } from 'vitest'
import { calcTotals, DELIVERY_FREE_THRESHOLD_PAISE, DELIVERY_TIERS, RETAILER_QTY_THRESHOLD, WHOLESALER_QTY_THRESHOLD } from '@/lib/pricing'

describe('calcTotals', () => {
  it('applies correct tiered delivery for small orders', () => {
    // ₹50 order → ₹40 delivery (tier 1: up to ₹100)
    expect(calcTotals(5_000).delivery).toBe(4_000)
    // ₹150 order → ₹30 delivery (tier 2: up to ₹250)
    expect(calcTotals(15_000).delivery).toBe(3_000)
    // ₹350 order → ₹20 delivery (tier 3: up to ₹500)
    expect(calcTotals(35_000).delivery).toBe(2_000)
  })

  it('waives delivery for orders at or above ₹500', () => {
    expect(calcTotals(DELIVERY_FREE_THRESHOLD_PAISE).delivery).toBe(0)
    expect(calcTotals(DELIVERY_FREE_THRESHOLD_PAISE + 1).delivery).toBe(0)
    expect(calcTotals(DELIVERY_FREE_THRESHOLD_PAISE - 1).delivery).toBe(2_000)
  })

  it('total equals subtotal + delivery', () => {
    for (const subtotal of [0, 1, 5_000, 15_000, 35_000, 50_000, 999_999]) {
      const { subtotal: s, delivery, total } = calcTotals(subtotal)
      expect(total).toBe(s + delivery)
    }
  })

  it('handles zero subtotal', () => {
    const result = calcTotals(0)
    expect(result.delivery).toBe(DELIVERY_TIERS[0].fee)
    expect(result.total).toBe(DELIVERY_TIERS[0].fee)
  })

  it('constants have expected values', () => {
    expect(DELIVERY_FREE_THRESHOLD_PAISE).toBe(50_000)
    expect(DELIVERY_TIERS).toHaveLength(3)
    expect(RETAILER_QTY_THRESHOLD).toBe(6)
    expect(WHOLESALER_QTY_THRESHOLD).toBe(21)
  })
})
