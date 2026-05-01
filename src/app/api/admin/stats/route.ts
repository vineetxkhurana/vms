/**
 * GET /api/admin/stats — admin-only revenue + inventory summary
 */
import { NextResponse } from 'next/server'
import { err, getDB } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'edge'

export async function GET(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const [ordersRow, productsRow, usersRow, revenueRow, statusRow, lowStockRow, recentRow] = await db.batch([
    db.prepare("SELECT COUNT(*) as total FROM orders"),
    db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN stock < 5 THEN 1 ELSE 0 END) as low_stock FROM products WHERE is_active=1'),
    db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN role='retailer' THEN 1 ELSE 0 END) as retailers, SUM(CASE WHEN role='wholesaler' THEN 1 ELSE 0 END) as wholesalers FROM users WHERE role NOT IN ('admin','staff')"),
    // confirmed = payment received (paid/processing/shipped/delivered); pending = awaiting payment
    db.prepare("SELECT COALESCE(SUM(CASE WHEN status NOT IN ('pending','cancelled') THEN total_paise ELSE 0 END),0) as confirmed, COALESCE(SUM(CASE WHEN status='pending' THEN total_paise ELSE 0 END),0) as pending FROM orders"),
    // Orders by status
    db.prepare("SELECT status, COUNT(*) as count FROM orders GROUP BY status"),
    // Low stock products — only genuinely low (< 5 units); matches the stat card threshold
    db.prepare("SELECT id, name, stock FROM products WHERE is_active=1 AND stock < 5 ORDER BY stock ASC LIMIT 8"),
    // Recent orders
    db.prepare(`SELECT o.id, o.total_paise, o.status, o.created_at, u.name as customer_name, u.email
                FROM orders o JOIN users u ON o.user_id=u.id
                ORDER BY o.created_at DESC LIMIT 8`),
  ])

  const o = (ordersRow.results[0] ?? {}) as any
  const p = (productsRow.results[0] ?? {}) as any
  const u = (usersRow.results[0] ?? {}) as any
  const r = (revenueRow.results[0] ?? {}) as any

  // Build status map
  const statusCounts: Record<string, number> = {}
  for (const row of (statusRow.results ?? []) as any[]) {
    statusCounts[row.status] = row.count
  }

  const data = {
    orders:           { total: o.total ?? 0 },
    products:         { total: p.total ?? 0, low_stock: p.low_stock ?? 0 },
    users:            { total: u.total ?? 0, retailers: u.retailers ?? 0, wholesalers: u.wholesalers ?? 0 },
    revenue_paise:    r.confirmed ?? 0,
    pending_paise:    r.pending ?? 0,
    status_counts:    statusCounts,
    low_stock_items:  lowStockRow.results ?? [],
    recent_orders:    recentRow.results ?? [],
  }
  // Prevent any CDN / Next.js route cache from serving stale stats
  const res = NextResponse.json(data)
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return res
}
