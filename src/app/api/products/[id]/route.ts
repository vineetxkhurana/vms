import { NextResponse } from 'next/server'
import { ok, err, getDB } from '@/lib/api'
import { getUser, requireAdmin, resolvePrice } from '@/lib/auth'

export const runtime = 'edge'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const { id } = await params
  const user = await getUser(req)

  const product = await db
    .prepare(
      `SELECT p.*, c.name as category_name
              FROM products p LEFT JOIN categories c ON p.category_id=c.id
              WHERE p.id=? AND p.is_active=1`,
    )
    .bind(Number(id))
    .first<any>()
  if (!product) return err('Not found', 404)

  const resolvedPrice = resolvePrice(
    product.price,
    product.price_retailer,
    product.price_wholesaler,
    user?.role ?? null,
  )

  // If this product belongs to a variant group, fetch all siblings
  let variants: any[] = []
  if (product.variant_group) {
    const { results } = await db
      .prepare(
        `SELECT id, name, variant_label as label, price, price_retailer, price_wholesaler, stock, image_url
                FROM products WHERE variant_group=? AND is_active=1 AND id!=? ORDER BY id ASC`,
      )
      .bind(product.variant_group, product.id)
      .all<any>()
    variants = results.map(v => ({
      ...v,
      price: resolvePrice(v.price, v.price_retailer, v.price_wholesaler, user?.role ?? null),
    }))
  }

  return ok({
    ...product,
    price: resolvedPrice,
    variants,
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const body = (await req.json()) as Record<string, unknown>
  const fields = [
    'name',
    'description',
    'price',
    'brand',
    'stock',
    'category_id',
    'image_url',
    'is_active',
    'price_retailer',
    'price_wholesaler',
    'variant_group',
    'variant_label',
    'variant_type',
  ]
  const updates = Object.entries(body).filter(([k]) => fields.includes(k))
  if (!updates.length) return err('Nothing to update')

  const sql = `UPDATE products SET ${updates.map(([k]) => `${k}=?`).join(',')} WHERE id=?`
  await db
    .prepare(sql)
    .bind(...updates.map(([, v]) => v), Number(id))
    .run()
  return ok({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.prepare('UPDATE products SET is_active=0 WHERE id=?').bind(Number(id)).run()
  return ok({ ok: true })
}
