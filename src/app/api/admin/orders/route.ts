// Admin: list all orders with pagination + status filter, or get single order with items
import { NextResponse } from 'next/server'
import { ok, err, getDB } from '@/lib/api'
import { requireStaff } from '@/lib/auth'

export const runtime = process.env.CF_PAGES ? 'edge' : 'nodejs'

export async function GET(req: Request) {
  const db = getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireStaff(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)

  // Single order with items
  const orderId = searchParams.get('order_id')
  if (orderId) {
    const { results: items } = await db
      .prepare(`SELECT oi.product_id, oi.quantity, oi.price_paise,
                       p.name as product_name, p.image_url, p.variant_label, p.variant_type
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = ?`)
      .bind(Number(orderId))
      .all()
    return ok({ items })
  }

  const page   = Math.max(1, Number(searchParams.get('page') ?? 1))
  const status = searchParams.get('status')
  const limit  = 30
  const offset = (page - 1) * limit

  // Total count for pagination
  let countSql = "SELECT COUNT(*) as total FROM orders"
  const countParams: unknown[] = []
  if (status) { countSql += ' WHERE status=?'; countParams.push(status) }
  const countRow = await db.prepare(countSql).bind(...countParams).first<{ total: number }>()

  let sql = `SELECT o.id, o.total_paise as total, o.status, o.created_at, o.address_json,
               u.email, u.phone, u.name as customer_name
             FROM orders o JOIN users u ON o.user_id=u.id`
  const params: unknown[] = []
  if (status) { sql += ' WHERE o.status=?'; params.push(status) }
  sql += ` ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const { results } = await db.prepare(sql).bind(...params).all()
  return ok({ orders: results, page, total: countRow?.total ?? 0 })
}

export async function PATCH(req: Request) {
  const db = getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireStaff(req)
  if (auth instanceof NextResponse) return auth

  const { id, status } = await req.json() as { id: number; status: string }
  const valid = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
  if (!valid.includes(status)) return err('Invalid status')

  const order = await db
    .prepare('SELECT status FROM orders WHERE id=?')
    .bind(id)
    .first<{ status: string }>()
  if (!order) return err('Order not found', 404)

  await db.prepare('UPDATE orders SET status=? WHERE id=?').bind(status, id).run()

  // Restore stock when cancelling a non-cancelled order
  if (status === 'cancelled' && order.status !== 'cancelled') {
    const { results: items } = await db
      .prepare('SELECT product_id, quantity FROM order_items WHERE order_id=?')
      .bind(id)
      .all<{ product_id: number; quantity: number }>()

    if (items.length > 0) {
      const restoreStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
      await db.batch(items.map(i => restoreStmt.bind(i.quantity, i.product_id)))
    }
  }

  return ok({ ok: true })
}
