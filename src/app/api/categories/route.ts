import { ok, getDB } from '@/lib/api'

export const runtime = process.env.CF_PAGES ? 'edge' : 'nodejs'

export async function GET(req: Request) {
  const db = getDB(req)
  if (!db) return ok({ categories: [] })

  const { results } = await db
    .prepare('SELECT id, name FROM categories ORDER BY id ASC')
    .all<{ id: number; name: string }>()

  return ok({ categories: results })
}
