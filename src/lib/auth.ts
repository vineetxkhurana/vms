import { SignJWT, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types'

const ALG = 'HS256'
const EXPIRY = '7d'

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not set')
  return new TextEncoder().encode(s)
}

export type JWTPayload = {
  sub: string            // user id
  email: string | null
  phone: string | null
  role: UserRole
  name: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(await secret())
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, await secret())
  return payload as unknown as JWTPayload
}

export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.headers.get('cookie')
  const match = cookie?.match(/vms_token=([^;]+)/)
  return match?.[1] ?? null
}

export async function getUser(req: Request): Promise<JWTPayload | null> {
  const token = tokenFromRequest(req)
  if (!token) return null
  try { return await verifyToken(token) }
  catch { return null }
}

/** Returns user payload or a 401 NextResponse */
export async function requireUser(req: Request): Promise<JWTPayload | NextResponse> {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return user
}

/** Admin or staff can access general admin routes */
export async function requireStaff(req: Request): Promise<JWTPayload | NextResponse> {
  const user = await getUser(req)
  if (!user || !['admin', 'staff'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return user
}

/** Only admin (owner) can access sensitive routes */
export async function requireAdmin(req: Request): Promise<JWTPayload | NextResponse> {
  const user = await getUser(req)
  if (!user || user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return user
}

/** Resolve the correct product price (paise) for a given user role */
export function resolvePrice(
  basePrice: number,
  retailerPrice: number | null | undefined,
  wholesalerPrice: number | null | undefined,
  role: UserRole | null,
): number {
  if (role === 'retailer' && retailerPrice != null) return retailerPrice
  if (role === 'wholesaler' && wholesalerPrice != null) return wholesalerPrice
  return basePrice
}

