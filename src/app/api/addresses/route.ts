/**
 * Customer address book API
 * GET    /api/addresses           → list user's addresses
 * POST   /api/addresses           → create new address
 * PATCH  /api/addresses?id=N      → update address or set as default
 * DELETE /api/addresses?id=N      → delete address
 */
import { ok, err, getDB } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { z } from 'zod'

export const runtime = 'edge'

const AddressSchema = z.object({
  label: z.string().max(50).default('Home'),
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\d{10}$/, '10-digit phone required'),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pin: z.string().regex(/^\d{6}$/, '6-digit PIN required'),
  is_default: z.number().int().min(0).max(1).optional(),
})

export async function GET(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const user = await getUser(req)
  if (!user) return err('Unauthorized', 401)

  const { results } = await db
    .prepare('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC, id DESC')
    .bind(Number(user.sub))
    .all<any>()
  return ok({ addresses: results })
}

export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const user = await getUser(req)
  if (!user) return err('Unauthorized', 401)

  const body = AddressSchema.safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)
  const d = body.data

  // If this is the first address or marked as default, clear other defaults
  if (d.is_default) {
    await db
      .prepare('UPDATE addresses SET is_default=0 WHERE user_id=?')
      .bind(Number(user.sub))
      .run()
  }

  const { results } = await db
    .prepare('SELECT COUNT(*) as cnt FROM addresses WHERE user_id=?')
    .bind(Number(user.sub))
    .all<{ cnt: number }>()
  const isFirst = results[0]?.cnt === 0

  const result = await db
    .prepare(
      `INSERT INTO addresses (user_id, label, name, phone, line1, line2, city, state, pin, is_default)
              VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING id`,
    )
    .bind(
      Number(user.sub),
      d.label,
      d.name,
      d.phone,
      d.line1,
      d.line2 ?? null,
      d.city,
      d.state,
      d.pin,
      isFirst || d.is_default ? 1 : 0,
    )
    .first<{ id: number }>()

  return ok({ id: result!.id }, 201)
}

export async function PATCH(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const user = await getUser(req)
  if (!user) return err('Unauthorized', 401)

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return err('id required')

  // Verify ownership
  const addr = await db
    .prepare('SELECT id FROM addresses WHERE id=? AND user_id=?')
    .bind(id, Number(user.sub))
    .first<{ id: number }>()
  if (!addr) return err('Not found', 404)

  const body = AddressSchema.partial().safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)
  const d = body.data

  if (d.is_default) {
    await db
      .prepare('UPDATE addresses SET is_default=0 WHERE user_id=?')
      .bind(Number(user.sub))
      .run()
  }

  const fields = ['label', 'name', 'phone', 'line1', 'line2', 'city', 'state', 'pin', 'is_default']
  const updates = Object.entries(d).filter(([k]) => fields.includes(k))
  if (!updates.length) return ok({ ok: true })

  await db
    .prepare(
      `UPDATE addresses SET ${updates.map(([k]) => `${k}=?`).join(',')} WHERE id=? AND user_id=?`,
    )
    .bind(...updates.map(([, v]) => v), id, Number(user.sub))
    .run()

  return ok({ ok: true })
}

export async function DELETE(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const user = await getUser(req)
  if (!user) return err('Unauthorized', 401)

  const id = Number(new URL(req.url).searchParams.get('id'))
  if (!id) return err('id required')

  await db
    .prepare('DELETE FROM addresses WHERE id=? AND user_id=?')
    .bind(id, Number(user.sub))
    .run()
  return ok({ ok: true })
}
