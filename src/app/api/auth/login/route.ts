/**
 * POST /api/auth/login
 * Body: { identifier: string (email or phone), password: string }
 * Also supports OTP-only login via /api/auth/send-otp + /api/auth/verify-otp
 */
import { compare } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { err, rateLimit, getDB } from '@/lib/api'
import { signToken } from '@/lib/auth'
import type { UserRole } from '@/types'
import { z } from 'zod'

export const runtime = 'edge'

const LoginSchema = z.object({
  identifier: z
    .string()
    .min(1)
    .transform(s => s.trim().toLowerCase()),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)

  const ip = req.headers.get('cf-connecting-ip') ?? 'unknown'
  if (!(await rateLimit(db, `login:${ip}`, 5, 60))) return err('Too many requests', 429)

  const body = LoginSchema.safeParse(await req.json())
  if (!body.success) return err('Invalid credentials')

  const { identifier, password } = body.data

  // Support login by email OR phone
  const user = await db
    .prepare(
      'SELECT id, email, phone, name, password_hash, role FROM users WHERE email = ? OR phone = ? LIMIT 1',
    )
    .bind(identifier, identifier)
    .first<{
      id: number
      email: string | null
      phone: string | null
      name: string
      password_hash: string | null
      role: UserRole
    }>()

  if (!user || !user.password_hash || !(await compare(password, user.password_hash)))
    return err('Invalid credentials', 401)

  const token = await signToken({
    sub: String(user.id),
    email: user.email ?? null,
    phone: user.phone ?? null,
    role: user.role,
    name: user.name,
  })

  const res = NextResponse.json({ token, user: { id: user.id, name: user.name, role: user.role } })
  res.cookies.set('vms_token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
