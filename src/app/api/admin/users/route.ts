/**
 * GET  /api/admin/users        — list customers/retailers/wholesalers (admin only)
 * PATCH /api/admin/users       — update user role (admin only)
 */
import { NextResponse } from 'next/server'
import { ok, err, getDB } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'

export const runtime = process.env.CF_PAGES ? 'edge' : 'nodejs'

export async function GET(req: Request) {
  const db = getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const role   = searchParams.get('role')
  const search = searchParams.get('search')?.trim().slice(0, 100)
  const page   = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit  = 30
  const offset = (page - 1) * limit

  let sql = `SELECT id, email, phone, name, role, is_verified, created_at
             FROM users WHERE role NOT IN ('admin','staff')`
  const params: unknown[] = []

  if (role)   { sql += ' AND role=?'; params.push(role) }
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`) }

  sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const { results } = await db.prepare(sql).bind(...params).all()
  return ok({ users: results, page })
}

const PatchSchema = z.object({
  id:   z.number(),
  role: z.enum(['customer', 'retailer', 'wholesaler']),
})

export async function PATCH(req: Request) {
  const db = getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const body = PatchSchema.safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)

  await db
    .prepare('UPDATE users SET role=? WHERE id=? AND role NOT IN (?,?)')
    .bind(body.data.role, body.data.id, 'admin', 'staff')
    .run()
  return ok({ ok: true })
}
