/**
 * POST /api/auth/register
 * Body: { identifier: string (email or phone), name: string, password?: string }
 * Password is optional — users can also use OTP-only auth.
 */
import { hash } from 'bcryptjs'
import { ok, err, rateLimit, getDB } from '@/lib/api'
import type { UserRole } from '@/types'
import { isPhone, normalisePhone } from '@/lib/otp'
import { trackD1Event as trackEvent, analyticsContext } from '@/lib/observability'
import { z } from 'zod'

export const runtime = 'edge'

const RegisterSchema = z.object({
  identifier: z.string().min(1).transform(s => s.trim().toLowerCase()),
  name:       z.string().min(1).max(80),
  password:   z.string().min(8).optional(),
})

export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)

  const ip = req.headers.get('cf-connecting-ip') ?? 'unknown'
  if (!(await rateLimit(db, `register:${ip}`, 5, 60))) return err('Too many requests', 429)

  const body = RegisterSchema.safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)

  const { identifier, name, password } = body.data
  const isPhoneId = isPhone(identifier)
  const normId    = isPhoneId ? normalisePhone(identifier) : identifier
  const col       = isPhoneId ? 'phone' : 'email'

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!isPhoneId && !emailRe.test(normId)) return err('Enter a valid email or 10-digit phone number')

  const exists = await db.prepare(`SELECT id FROM users WHERE ${col} = ?`).bind(normId).first()
  if (exists) return err(`${isPhoneId ? 'Phone' : 'Email'} already registered`, 409)

  const password_hash = password ? await hash(password, 10) : null

  const result = await db
    .prepare(
      `INSERT INTO users (${col}, name, password_hash, is_verified) VALUES (?,?,?,0)
       RETURNING id, role`,
    )
    .bind(normId, name, password_hash)
    .first<{ id: number; role: UserRole }>()

  // Don't issue a session token — user must verify via OTP first
  const { country, sessionId } = analyticsContext(req)
  trackEvent(db, 'user_registered', { method: isPhoneId ? 'phone' : 'email' }, { userId: result!.id, sessionId: sessionId ?? undefined, country: country ?? undefined })

  return ok({ user: { id: result!.id, name, role: result!.role }, needs_otp_verify: true })
}

