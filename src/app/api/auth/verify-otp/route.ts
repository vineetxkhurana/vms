/**
 * POST /api/auth/verify-otp
 * Body: { identifier, code, name? (required only for 'register' type) }
 * Returns: { token, user, is_new_user }
 */
import { NextResponse } from 'next/server'
import { err, rateLimit, getDB } from '@/lib/api'
import { verifyOTP, isPhone, normalisePhone } from '@/lib/otp'
import { signToken } from '@/lib/auth'
import type { UserRole } from '@/types'
import { z } from 'zod'

export const runtime = 'edge'

const Schema = z.object({
  identifier: z.string().min(1).transform(s => s.trim().toLowerCase()),
  code:       z.string().length(6),
  type:       z.enum(['login', 'register', 'reset']).default('login'),
  name:       z.string().min(1).max(80).optional(),
})

export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)

  const ip = req.headers.get('cf-connecting-ip') ?? 'unknown'
  if (!(await rateLimit(db, `otp:verify:${ip}`, 10, 60))) return err('Too many requests', 429)

  const body = Schema.safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)

  const { identifier, code, type, name } = body.data
  const normId = isPhone(identifier) ? normalisePhone(identifier) : identifier

  // Verify the OTP
  const result = await verifyOTP(db, normId, code, type)
  if (result === 'expired') return err('OTP expired. Request a new one.', 400)
  if (result === 'used')    return err('OTP already used. Request a new one.', 400)
  if (result !== 'ok')      return err('Invalid OTP.', 400)

  const isPhoneId = isPhone(normId)
  const col = isPhoneId ? 'phone' : 'email'

  // Find or create user
  let user = await db
    .prepare(`SELECT id, email, phone, name, role, is_verified FROM users WHERE ${col} = ?`)
    .bind(normId)
    .first<{ id: number; email: string | null; phone: string | null; name: string; role: UserRole; is_verified: number }>()

  let isNewUser = false

  if (!user) {
    // Auto-register if user doesn't exist
    const displayName = name ?? (isPhoneId ? normId : normId.split('@')[0])
    const inserted = await db
      .prepare(
        `INSERT INTO users (${col}, name, is_verified) VALUES (?, ?, 1)
         RETURNING id, email, phone, name, role`,
      )
      .bind(normId, displayName)
      .first<{ id: number; email: string | null; phone: string | null; name: string; role: UserRole }>()
    user = { ...inserted!, is_verified: 1 }
    isNewUser = true
  } else {
    // Mark verified
    await db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').bind(user.id).run()
  }

  const token = await signToken({
    sub:   String(user.id),
    email: user.email ?? null,
    phone: user.phone ?? null,
    role:  user.role,
    name:  user.name,
  })

  const res = NextResponse.json({ token, is_new_user: isNewUser, user: { id: user.id, name: user.name, role: user.role } })
  res.cookies.set('vms_token', token, { path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 7 })
  return res
}
