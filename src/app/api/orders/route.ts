import { ok, err, rateLimit, getDB } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { createRazorpayOrder } from '@/lib/razorpay'
import { calcTotals } from '@/lib/pricing'
import { z } from 'zod'

export const runtime = process.env.CF_PAGES ? 'edge' : 'nodejs'

const OrderSchema = z.object({
  items: z.array(z.object({ product_id: z.number(), quantity: z.number().min(1) })).min(1),
  address: z.object({
    name: z.string().min(1), phone: z.string().regex(/^\d{10}$/),
    line1: z.string().min(1), line2: z.string().optional(),
    city: z.string().min(1), state: z.string().min(1), pin: z.string().regex(/^\d{6}$/),
  }),
})

export async function POST(req: Request) {
  const db = getDB(req)
  if (!db) return err('Service unavailable', 503)
  const user = await getUser(req)
  if (!user) return err('Unauthorized', 401)

  if (!(await rateLimit(db, `checkout:${user.sub}`, 3, 60))) return err('Too many requests', 429)

  const body = OrderSchema.safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)

  const { items, address } = body.data

  // Validate stock and calculate total — apply tier pricing
  const productIds = items.map(i => i.product_id)
  const { results: products } = await db
    .prepare(`SELECT id, price, price_retailer, price_wholesaler, stock FROM products
              WHERE id IN (${productIds.map(() => '?').join(',')}) AND is_active=1`)
    .bind(...productIds)
    .all<{ id: number; price: number; price_retailer: number | null; price_wholesaler: number | null; stock: number }>()

  if (products.length !== items.length) return err('One or more products unavailable')

  type PRow = typeof products[number]
  const productMap = new Map<number, PRow>(products.map((p: PRow) => [p.id, p]))

  let total = 0
  const lineItems: Array<{ product_id: number; quantity: number; price: number }> = []
  for (const item of items) {
    const p = productMap.get(item.product_id)!
    if (p.stock < item.quantity) return err(`Insufficient stock for product ${item.product_id}`)
    const price = user.role === 'retailer' && p.price_retailer != null ? p.price_retailer
                : user.role === 'wholesaler' && p.price_wholesaler != null ? p.price_wholesaler
                : p.price
    total += price * item.quantity
    lineItems.push({ product_id: item.product_id, quantity: item.quantity, price })
  }

  // Add GST (5%) + flat ₹100 delivery fee
  const { gst, delivery, total: grandTotal } = calcTotals(total)

  // In dev (no Razorpay keys), create a mock order id; in prod this hits Razorpay
  let razorpayOrderId: string | null = null
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const rzp = await createRazorpayOrder(grandTotal, `vms-${Date.now()}`) as { id: string }
    razorpayOrderId = rzp.id
  }

  const order = await db
    .prepare('INSERT INTO orders (user_id, total_paise, razorpay_order_id, address_json) VALUES (?,?,?,?) RETURNING id')
    .bind(Number(user.sub), grandTotal, razorpayOrderId, JSON.stringify(address))
    .first<{ id: number }>()

  if (!order) return err('Failed to create order', 500)

  const priceStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price_paise) VALUES (?,?,?,?)')
  await db.batch(lineItems.map(i => priceStmt.bind(order.id, i.product_id, i.quantity, i.price)))

  // Atomically deduct stock: UPDATE only succeeds if stock is still sufficient.
  // This prevents the race condition where two concurrent checkouts both pass
  // the in-memory stock check and both decrement from the same quantity.
  const stockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
  const stockResults = await db.batch(lineItems.map(i => stockStmt.bind(i.quantity, i.product_id, i.quantity)))

  // Verify all rows were actually updated (meta.changes available in D1 prod;
  // in local dev the batch wrapper omits meta so we fall back to truthy success check)
  const allUpdated = stockResults.every((r: any) =>
    typeof r.meta?.changes === 'number' ? r.meta.changes >= 1 : r.success !== false
  )
  if (!allUpdated) {
    await db.prepare('DELETE FROM order_items WHERE order_id=?').bind(order.id).run()
    await db.prepare('DELETE FROM orders WHERE id=?').bind(order.id).run()
    return err('One or more items went out of stock. Please refresh and try again.', 409)
  }

  return ok({ order_id: order.id, razorpay_order_id: razorpayOrderId, amount: grandTotal, subtotal: total, gst, delivery }, 201)
}

export async function GET(req: Request) {
  const db = getDB(req)
  if (!db) return err('Service unavailable', 503)
  const user = await getUser(req)
  if (!user) return err('Unauthorized', 401)

  const { results: orders } = await db
    .prepare(`SELECT id, total_paise as total, status, address_json, created_at
              FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 50`)
    .bind(Number(user.sub))
    .all<{ id: number; total: number; status: string; address_json: string; created_at: number }>()

  if (orders.length === 0) return ok({ orders: [] })

  // Fetch items for all orders in one query
  const orderIds = orders.map(o => o.id)
  const { results: items } = await db
    .prepare(`SELECT oi.order_id, oi.quantity, oi.price_paise as unit_price,
                     p.name as product_name, p.image_url
              FROM order_items oi
              JOIN products p ON p.id = oi.product_id
              WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})`)
    .bind(...orderIds)
    .all<{ order_id: number; quantity: number; unit_price: number; product_name: string; image_url: string | null }>()

  const itemsByOrder = new Map<number, typeof items>()
  for (const item of items) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
    itemsByOrder.get(item.order_id)!.push(item)
  }

  return ok({
    orders: orders.map(o => ({
      ...o,
      address: JSON.parse(o.address_json),
      items: itemsByOrder.get(o.id) ?? [],
    })),
  })
}
