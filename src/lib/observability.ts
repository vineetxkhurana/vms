/**
 * Observability helpers — metrics & structured logs via Sentry.
 *
 * Metrics  → Sentry Application Metrics (counters, distributions, gauges, sets)
 * Logs     → Sentry structured log capture (with level, context, tags)
 * Perf     → Sentry spans / transactions for API timing
 *
 * All helpers are no-ops when DSN is absent (local dev without .env.local).
 */
import * as Sentry from '@sentry/nextjs'

// ─── Structured Logger ────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
type LogContext = Record<string, unknown>

function log(level: LogLevel, message: string, ctx?: LogContext) {
  // Always write to console (captured by Cloudflare Workers Logs in prod)
  const fn = level === 'error' || level === 'fatal' ? console.error : console.warn
  fn(JSON.stringify({ level, message, ...ctx, ts: new Date().toISOString() }))

  // Also capture to Sentry structured logs (SDK ≥ 8.x / _experiments.enableLogs)
  try {
    const sentryLogger = (Sentry as any).logger
    if (sentryLogger?.[level]) {
      sentryLogger[level](message, ctx)
    } else {
      // Fallback: add as breadcrumb so it appears in Sentry error context
      Sentry.addBreadcrumb({
        message,
        level: level as any,
        data: ctx,
        timestamp: Date.now() / 1000,
      })
    }
  } catch {
    /* never block */
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
  fatal: (msg: string, ctx?: LogContext) => log('fatal', msg, ctx),
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

/**
 * Increment a counter metric.
 * e.g. metrics.increment('cart.add', 1, { category: 'vitamins' })
 */
export function increment(name: string, value = 1, tags?: Record<string, string>) {
  try {
    ;(Sentry as any).metrics?.increment(name, value, { tags })
  } catch {
    /* no-op */
  }
}

/**
 * Record a distribution (e.g. response time in ms, price in paise).
 * Appears as a histogram in Sentry dashboards.
 */
export function distribution(
  name: string,
  value: number,
  unit = 'millisecond',
  tags?: Record<string, string>,
) {
  try {
    ;(Sentry as any).metrics?.distribution(name, value, { unit, tags })
  } catch {
    /* no-op */
  }
}

/**
 * Set a gauge (current value — e.g. active sessions, cart size).
 */
export function gauge(name: string, value: number, tags?: Record<string, string>) {
  try {
    ;(Sentry as any).metrics?.gauge(name, value, { tags })
  } catch {
    /* no-op */
  }
}

/**
 * Count unique values (e.g. unique users viewing a product).
 */
export function uniqueSet(name: string, value: string | number, tags?: Record<string, string>) {
  try {
    ;(Sentry as any).metrics?.set(name, value, { tags })
  } catch {
    /* no-op */
  }
}

// ─── Business Events ─────────────────────────────────────────────────────────

/** Track an e-commerce / business event with automatic metrics. */
export function trackEvent(event: string, props?: Record<string, string | number>) {
  increment(`event.${event}`)
  Sentry.addBreadcrumb({ category: 'business', message: event, data: props, level: 'info' })
  logger.info(`[event] ${event}`, props)
}

// Named business events for type safety
export const events = {
  pageView: (path: string) => trackEvent('page_view', { path }),
  search: (query: string, results: number) => trackEvent('search', { query, results }),
  productView: (id: number, name: string) => trackEvent('product_view', { id, name }),
  cartAdd: (id: number, name: string) => trackEvent('cart_add', { id, name }),
  cartRemove: (id: number) => trackEvent('cart_remove', { id }),
  checkoutStart: () => trackEvent('checkout_start'),
  orderPlaced: (orderId: number, total: number) => trackEvent('order_placed', { orderId, total }),
  authLogin: (method: string) => trackEvent('auth_login', { method }),
  authRegister: () => trackEvent('auth_register'),
  b2bApply: () => trackEvent('b2b_apply'),
}

// ─── API Route Wrapper ────────────────────────────────────────────────────────

/**
 * withObservability wraps an edge API route handler with:
 * - Automatic timing (distribution metric: api.latency)
 * - Structured request/response logging
 * - Sentry error capture with context
 * - Unhandled errors return JSON 500
 *
 * Usage:
 *   export const GET = withObservability(async (req) => { ... }, 'products.list')
 */
export function withObservability<T extends Request>(
  handler: (req: T) => Promise<Response>,
  operationName: string,
): (req: T) => Promise<Response> {
  return async (req: T) => {
    const start = Date.now()
    const method = req.method
    const url = new URL(req.url)
    const path = url.pathname

    try {
      const response = await handler(req)
      const latency = Date.now() - start
      const status = response.status

      distribution('api.latency', latency, 'millisecond', {
        operation: operationName,
        method,
        status: String(status),
      })
      increment('api.requests', 1, { operation: operationName, method, status: String(status) })
      logger.info(`${method} ${path} → ${status}`, { latency, operation: operationName })

      return response
    } catch (error) {
      const latency = Date.now() - start
      increment('api.errors', 1, { operation: operationName, method })
      logger.error(`${method} ${path} → 500`, {
        latency,
        operation: operationName,
        error: String(error),
      })
      await Sentry.captureException(error, {
        extra: { url: req.url, method, operation: operationName },
      })

      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}

// ─── D1 Analytics (server-side event persistence) ────────────────────────────

export type AnalyticsEventName =
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_started'
  | 'order_placed'
  | 'user_registered'
  | 'login'

/** Persist an event to D1 analytics_events table. Fire-and-forget. */
export async function trackD1Event(
  db: D1Database,
  event: AnalyticsEventName,
  meta: Record<string, string | number | boolean | null> = {},
  opts: { userId?: number; sessionId?: string; country?: string } = {},
): Promise<void> {
  try {
    await db
      .prepare(
        'INSERT INTO analytics_events (event, session_id, user_id, metadata, country) VALUES (?,?,?,?,?)',
      )
      .bind(
        event,
        opts.sessionId ?? null,
        opts.userId ?? null,
        JSON.stringify(meta),
        opts.country ?? null,
      )
      .run()
  } catch {
    /* never block */
  }
}

/** Extract country + anonymous session from Cloudflare request headers. */
export function analyticsContext(req: Request): {
  country: string | null
  sessionId: string | null
} {
  return {
    country: req.headers.get('cf-ipcountry'),
    sessionId: req.headers.get('x-session-id'),
  }
}
