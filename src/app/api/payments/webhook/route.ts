/**
 * POST /api/payments/webhook
 *
 * Razorpay sends a signed POST here for every payment event.
 * This is the authoritative payment confirmation — it fires even when the
 * customer closes the browser before our `handler` callback runs.
 *
 * Setup (one-time):
 *   Razorpay Dashboard → Settings → Webhooks → Add webhook
 *   URL: https://your-domain.com/api/payments/webhook
 *   Events: payment.captured, payment.failed
 *   Secret: the value of RAZORPAY_WEBHOOK_SECRET
 */

import { err, ok, getDB } from '@/lib/api'

export const runtime = 'edge'

async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const hex = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return hex === signature
}

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) return err('Webhook not configured', 500)

  const signature = req.headers.get('x-razorpay-signature') ?? ''
  const rawBody = await req.text()

  const valid = await verifyWebhookSignature(rawBody, signature, webhookSecret)
  if (!valid) return err('Invalid signature', 400)

  let event: { event: string; payload: any }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return err('Invalid JSON', 400)
  }

  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)

  const { event: eventName, payload } = event

  if (eventName === 'payment.captured') {
    const payment = payload?.payment?.entity
    const orderId = payment?.order_id as string | undefined
    const paymentId = payment?.id as string | undefined

    if (!orderId || !paymentId) return ok({ received: true })

    // Idempotent: only update if still in pending/created state
    await db
      .prepare(
        `
        UPDATE orders
        SET status = 'paid', razorpay_payment_id = ?
        WHERE razorpay_order_id = ?
          AND status IN ('pending', 'created')
      `,
      )
      .bind(paymentId, orderId)
      .run()
  }

  if (eventName === 'payment.failed') {
    const payment = payload?.payment?.entity
    const orderId = payment?.order_id as string | undefined
    if (!orderId) return ok({ received: true })

    // On payment failure: revert stock for the cancelled order so inventory is accurate.
    // Use a transaction-like batch: mark order cancelled + restore stock quantities.
    await db.batch([
      db
        .prepare(
          `
        UPDATE orders SET status = 'cancelled', razorpay_payment_id = ?
        WHERE razorpay_order_id = ? AND status = 'pending'
      `,
        )
        .bind(`FAILED:${payment?.id ?? 'unknown'}`, orderId),
      db
        .prepare(
          `
        UPDATE products SET stock = stock + oi.quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.razorpay_order_id = ? AND products.id = oi.product_id
      `,
        )
        .bind(orderId),
    ])
  }

  // Cleanup stale pending orders older than 30 minutes and restore their stock.
  // Runs opportunistically on every webhook call (low overhead, no cron needed).
  await db.batch([
    db
      .prepare(
        `
      UPDATE products SET stock = stock + (
        SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'pending'
          AND o.created_at < unixepoch() - 1800
          AND oi.product_id = products.id
      )
      WHERE id IN (
        SELECT DISTINCT oi.product_id FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'pending' AND o.created_at < unixepoch() - 1800
      )
    `,
      )
      .bind(),
    db
      .prepare(
        `
      UPDATE orders SET status = 'cancelled'
      WHERE status = 'pending' AND created_at < unixepoch() - 1800
    `,
      )
      .bind(),
  ])

  // Always return 200 — Razorpay retries on non-2xx responses
  return ok({ received: true })
}
