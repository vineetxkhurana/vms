import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

function captureException(error: unknown, ctx?: Record<string, unknown>) {
  try { Sentry.captureException(error, ctx ? { extra: ctx } : undefined) } catch { /* no-op */ }
}

// Note: `runtime` is set per-route, NOT in lib files.
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * D1-backed rate limiter — works across all edge instances (no cold-start reset).
 * Uses an UPSERT so it's a single DB round-trip.
 */
export async function rateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  const resetAt = now + windowSec
  try {
    const row = await db
      .prepare(`
        INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
        ON CONFLICT(key) DO UPDATE SET
          count    = CASE WHEN reset_at <= ? THEN 1          ELSE count + 1 END,
          reset_at = CASE WHEN reset_at <= ? THEN ?          ELSE reset_at  END
        RETURNING count
      `)
      .bind(key, resetAt, now, now, resetAt)
      .first<{ count: number }>()
    return (row?.count ?? 1) <= limit
  } catch {
    // If rate_limits table doesn't exist yet (pre-migration), allow the request
    return true
  }
}

/** Helper: extract D1 DB from edge request env, with local dev fallback */
export async function getDB(req: Request): Promise<D1Database | null> {
  // next-on-pages: access Cloudflare bindings via getRequestContext()
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages')
    const db = (getRequestContext().env as unknown as { DB?: D1Database }).DB
    if (db) return db
  } catch {
    // not in a next-on-pages context (local dev)
  }

  // Legacy path: some wrangler dev setups pass env on req
  const cloudflareDB = (req as any).env?.DB
  if (cloudflareDB) return cloudflareDB

  // Local `next dev` — use SQLite shim
  if (process.env.NODE_ENV === 'development') {
    const { getLocalDB } = await import('./local-db')
    return getLocalDB()
  }
  captureException(new Error('getDB: no DB binding available'), { url: (req as any).url })
  return null
}

