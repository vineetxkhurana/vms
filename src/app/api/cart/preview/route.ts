/**
 * POST /api/cart/preview
 * Resolves per-item pricing based on user role + quantity thresholds.
 * Works for both authenticated and guest users.
 *
 * Body: { items: [{ product_id: number, quantity: number }] }
 * Returns: { items: [...], subtotal, delivery, total }
 */
import { ok, err, getDB } from '@/lib/api'
import { getUser, resolvePrice } from '@/lib/auth'
import { calcTotals } from '@/lib/pricing'
import type { UserRole } from '@/types'
import { z } from 'zod'

export const runtime = 'edge'

const Schema = z.object({
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity:   z.number().int().positive(),
  })).min(1).max(50),
})

export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)

  const body = Schema.safeParse(await req.json())
  if (!body.success) return err('Invalid cart data')

  const { items } = body.data
  const user = await getUser(req)
  const role = (user?.role ?? null) as UserRole | null

  const ids = items.map(i => i.product_id)
  const placeholders = ids.map(() => '?').join(',')
  const products = await db
    .prepare(`SELECT id, price, price_retailer, price_wholesaler FROM products WHERE id IN (${placeholders}) AND is_active=1`)
    .bind(...ids)
    .all()
    .then((r: any) => r.results as Array<{ id: number; price: number; price_retailer: number | null; price_wholesaler: number | null }>)

  const productMap = new Map(products.map(p => [p.id, p]))

  let subtotal = 0
  const resolved = items.map(item => {
    const p = productMap.get(item.product_id)
    if (!p) return null
    const unitPrice = resolvePrice(p.price, p.price_retailer, p.price_wholesaler, role, item.quantity)
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice,
      mrp: p.price,
      line_total: lineTotal,
      was_discounted: unitPrice < p.price,
    }
  }).filter(Boolean)

  const { delivery, total } = calcTotals(subtotal)

  return ok({ items: resolved, subtotal, delivery, total })
}
