/**
 * POST /api/auth/send-otp
 * Body: { identifier: string (email or phone), type?: 'login'|'register'|'reset' }
 * Returns: { ok: true, dev_code?: string }
 */
import { ok, err, rateLimit, getDB } from '@/lib/api'
import { sendOTP, isPhone, normalisePhone } from '@/lib/otp'
import { z } from 'zod'

export const runtime = process.env.CF_PAGES ? 'edge' : 'nodejs'

const Schema = z.object({
  identifier: z.string().min(1).max(200).transform(s => s.trim().toLowerCase()),
  type: z.enum(['login', 'register', 'reset']).default('login'),
})

export async function POST(req: Request) {
  const db = getDB(req)
  if (!db) return err('Service unavailable', 503)

  const ip = req.headers.get('cf-connecting-ip') ?? 'unknown'
  if (!(await rateLimit(db, `otp:send:${ip}`, 5, 60))) return err('Too many requests', 429)

  const body = Schema.safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)

  const { identifier, type } = body.data

  // Normalise phone numbers
  const normId = isPhone(identifier) ? normalisePhone(identifier) : identifier

  // Validate format
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!isPhone(normId) && !emailRe.test(normId)) return err('Enter a valid email or 10-digit phone number')

  const { code } = await sendOTP(db, normId, type)
  return ok({ ok: true, ...(code ? { dev_code: code } : {}) })
}
