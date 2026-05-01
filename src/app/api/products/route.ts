import { NextResponse } from 'next/server'
import { ok, err, rateLimit, getDB } from '@/lib/api'
import { getUser, requireAdmin, resolvePrice } from '@/lib/auth'

export const runtime = 'edge'

// GET /api/products?page=1&category=1&search=paracetamol&brand=VMS
// GET /api/products?ids=1,2,3   (cart rehydration — returns fresh tier-priced products by ID)
export async function GET(req: Request) {
  const db = await getDB(req)
  if (!db) return ok({ products: [], page: 1, limit: 20 })

  const ip = req.headers.get('cf-connecting-ip') ?? 'unknown'
  if (!(await rateLimit(db, `search:${ip}`, 30, 60))) return err('Too many requests', 429)

  const user = await getUser(req)
  const { searchParams } = new URL(req.url)

  // ── Cart rehydration mode: fetch specific product IDs with fresh tier prices ──
  const idsParam = searchParams.get('ids')
  if (idsParam) {
    const ids = idsParam
      .split(',')
      .map(Number)
      .filter(n => n > 0 && Number.isInteger(n))
      .slice(0, 50)
    if (ids.length === 0) return ok({ products: [] })

    const { results } = await db
      .prepare(
        `SELECT p.id, p.name, p.description, p.price, p.price_retailer, p.price_wholesaler,
                  p.brand, p.stock, p.category_id, p.image_url, p.is_active,
                  p.variant_group, p.variant_label, p.variant_type,
                  c.name as category_name
                FROM products p LEFT JOIN categories c ON p.category_id=c.id
                WHERE p.id IN (${ids.map(() => '?').join(',')}) AND p.is_active=1`,
      )
      .bind(...ids)
      .all<any>()

    const products = results.map(p => ({
      ...p,
      price: resolvePrice(p.price, p.price_retailer, p.price_wholesaler, user?.role ?? null),
    }))
    return ok({ products })
  }

  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)))
  const offset = (page - 1) * limit
  const search = searchParams.get('search')?.trim().slice(0, 100)
  const category = searchParams.get('category')
  const brand = searchParams.get('brand')

  let sql = `SELECT p.id, p.name, p.description, p.price, p.price_retailer, p.price_wholesaler,
               p.brand, p.stock, p.category_id, p.image_url, p.is_active,
               p.variant_group, p.variant_label, p.variant_type,
               c.name as category_name
             FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.is_active=1`
  const params: unknown[] = []

  if (search) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (category) {
    sql += ' AND p.category_id=?'
    params.push(Number(category))
  }
  if (brand && ['VMS', 'other'].includes(brand)) {
    sql += ' AND p.brand=?'
    params.push(brand)
  }

  // Get total count for pagination
  const countSql =
    `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id=c.id WHERE p.is_active=1` +
    (search ? ' AND (p.name LIKE ? OR p.description LIKE ?)' : '') +
    (category ? ' AND p.category_id=?' : '') +
    (brand && ['VMS', 'other'].includes(brand) ? ' AND p.brand=?' : '')
  const countRow = await db
    .prepare(countSql)
    .bind(...params)
    .first<{ total: number }>()
  const total = countRow?.total ?? 0

  sql += ` ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}`

  const { results } = await db
    .prepare(sql)
    .bind(...params)
    .all<any>()

  // Apply tier pricing per requesting user's role
  const priced = results.map(p => ({
    ...p,
    price: resolvePrice(p.price, p.price_retailer, p.price_wholesaler, user?.role ?? null),
  }))

  // Group variants: collect all products that belong to a variant_group,
  // keep only the first (lowest id) as the "primary" and attach siblings as variants[]
  const groupMap = new Map<string, typeof priced>()
  const standalone: typeof priced = []

  for (const p of priced) {
    if (p.variant_group) {
      const group = groupMap.get(p.variant_group)
      if (group) {
        group.push(p)
      } else {
        groupMap.set(p.variant_group, [p])
      }
    } else {
      standalone.push(p)
    }
  }

  // Build final product list: primary products come from groupMap (first per group)
  const grouped = [...groupMap.values()].map(members => {
    // Sort by id so the lowest id is the "primary"
    members.sort((a, b) => a.id - b.id)
    const [primary, ...siblings] = members
    return {
      ...primary,
      variants: siblings.map(s => ({
        id: s.id,
        name: s.name,
        label: s.variant_label ?? '',
        price: s.price,
        stock: s.stock,
        image_url: s.image_url,
      })),
    }
  })

  // Merge: standalone products + grouped primaries, preserve original DESC order
  const _allIds = new Map(priced.map((p, i) => [p.id, i]))
  const firstIds = new Map([...groupMap.values()].map(m => [Math.min(...m.map(x => x.id)), true]))

  const products = priced
    .filter(p => !p.variant_group || firstIds.has(p.id))
    .map(p => {
      if (p.variant_group) {
        return grouped.find(g => g.id === p.id)!
      }
      return p
    })

  return ok({ products, page, limit, total })
}

// POST /api/products — admin only
export async function POST(req: Request) {
  const db = await getDB(req)
  if (!db) return err('Service unavailable', 503)
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  const body = (await req.json()) as Record<string, unknown>
  const {
    name,
    description,
    price,
    brand,
    stock,
    category_id,
    image_url,
    price_retailer,
    price_wholesaler,
    variant_group,
    variant_label,
    variant_type,
  } = body

  if (!name || !price) return err('name and price required')

  const result = await db
    .prepare(
      `INSERT INTO products
      (name, description, price, brand, stock, category_id, image_url,
       price_retailer, price_wholesaler, variant_group, variant_label, variant_type)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`,
    )
    .bind(
      name,
      description ?? null,
      Number(price),
      brand ?? 'other',
      Number(stock ?? 0),
      category_id ?? null,
      image_url ?? null,
      price_retailer ? Number(price_retailer) : null,
      price_wholesaler ? Number(price_wholesaler) : null,
      variant_group ?? null,
      variant_label ?? null,
      variant_type && variant_type !== 'none' ? variant_type : null,
    )
    .first<{ id: number }>()

  return ok({ id: result!.id }, 201)
}
