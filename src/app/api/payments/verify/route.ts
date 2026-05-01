import { ok, err, getDB } from '@/lib/api'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { getUser } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'edge'

const VerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)

  // Must be a logged-in user — prevents spoofed verify calls
  const user = await getUser(req)
  if (!user) return err('Unauthorized', 401)

  const body = VerifySchema.safeParse(await req.json())
  if (!body.success) return err('Invalid payload')

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body.data

  const valid = await verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  )
  if (!valid) return err('Payment verification failed', 400)

  // Only update orders belonging to this user — prevents user A confirming user B's order
  const _result = await db
    .prepare(
      `
      UPDATE orders
      SET status = 'paid', razorpay_payment_id = ?
      WHERE razorpay_order_id = ?
        AND user_id = ?
        AND status IN ('pending', 'created')
    `,
    )
    .bind(razorpay_payment_id, razorpay_order_id, Number(user.sub))
    .run()

  return ok({ success: true })
}
