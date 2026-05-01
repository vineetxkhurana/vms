import { ok, err, getDB } from '@/lib/api'
import { getUser } from '@/lib/auth'

export const runtime = 'edge'

export async function GET(req: Request) {
  const db   = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const user = await getUser(req)
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) return err('Forbidden', 403)

  const url  = new URL(req.url)
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '7', 10), 90)
  const since = Math.floor(Date.now() / 1000) - days * 86400

  const [funnelResult, dailyResult, topResult, totalResult] = await Promise.all([
    // Event funnel counts
    db.prepare(
      `SELECT event, COUNT(*) as count
       FROM analytics_events
       WHERE created_at >= ?
       GROUP BY event`
    ).bind(since).all<{ event: string; count: number }>(),

    // Daily order counts (last N days)
    db.prepare(
      `SELECT strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as day,
              COUNT(*) as count
       FROM analytics_events
       WHERE event = 'order_placed' AND created_at >= ?
       GROUP BY day
       ORDER BY day ASC`
    ).bind(since).all<{ day: string; count: number }>(),

    // Top viewed products
    db.prepare(
      `SELECT json_extract(metadata,'$.product_id') as product_id, COUNT(*) as count
       FROM analytics_events
       WHERE event = 'product_view' AND created_at >= ? AND product_id IS NOT NULL
       GROUP BY product_id
       ORDER BY count DESC
       LIMIT 10`
    ).bind(since).all<{ product_id: string; count: number }>(),

    // Total event count
    db.prepare(
      `SELECT COUNT(*) as total FROM analytics_events`
    ).first<{ total: number }>(),
  ])

  return ok({
    funnel:       funnelResult.results  ?? [],
    daily_orders: dailyResult.results   ?? [],
    top_products: topResult.results     ?? [],
    total_events: totalResult?.total    ?? 0,
  })
}
