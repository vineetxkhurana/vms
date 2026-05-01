/**
 * POST /api/admin/import
 * Accepts pre-parsed product rows from the CSV import UI.
 * Upserts by name (case-insensitive) — updates stock/price if product exists, inserts if new.
 * All prices are in rupees from the UI; converted to paise here.
 */
import { ok, err, getDB } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const RowSchema = z.object({
  name: z.string().min(1).max(300),
  sku: z.string().max(100).optional(),
  batch_number: z.string().max(100).optional(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  stock: z.number().int().min(0),
  price: z.number().positive(), // rupees
  price_retailer: z.number().positive().optional(),
  price_wholesaler: z.number().positive().optional(),
  brand: z.enum(['VMS', 'other']).default('other'),
})

const BodySchema = z.object({
  rows: z.array(RowSchema).min(1).max(500),
})

export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) return err(body.error.issues[0].message)

  const { rows } = body.data
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      // Prices are in rupees — convert to paise
      const pricePaise = Math.round(row.price * 100)
      const retailerPaise = row.price_retailer ? Math.round(row.price_retailer * 100) : null
      const wholesalerPaise = row.price_wholesaler ? Math.round(row.price_wholesaler * 100) : null

      // Check if product already exists by name (case-insensitive)
      const existing = await db
        .prepare('SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1')
        .bind(row.name)
        .first<{ id: number }>()

      if (existing) {
        // Update stock, price, and batch info
        await db
          .prepare(
            `UPDATE products SET
            stock = ?, price = ?,
            price_retailer = ?, price_wholesaler = ?,
            batch_number = ?, expiry_date = ?,
            brand = ?
            WHERE id = ?`,
          )
          .bind(
            row.stock,
            pricePaise,
            retailerPaise,
            wholesalerPaise,
            row.batch_number ?? null,
            row.expiry_date ?? null,
            row.brand,
            existing.id,
          )
          .run()
      } else {
        await db
          .prepare(
            `INSERT INTO products
            (name, price, price_retailer, price_wholesaler, stock, brand, batch_number, expiry_date, is_active)
            VALUES (?,?,?,?,?,?,?,?,1)`,
          )
          .bind(
            row.name,
            pricePaise,
            retailerPaise,
            wholesalerPaise,
            row.stock,
            row.brand,
            row.batch_number ?? null,
            row.expiry_date ?? null,
          )
          .run()
      }
      imported++
    } catch (e: any) {
      errors.push(`Row "${row.name}": ${e.message ?? 'Unknown error'}`)
      skipped++
    }
  }

  return ok({ imported, skipped, errors })
}
