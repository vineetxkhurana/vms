import { describe, it, expect } from 'vitest'
import { rateLimit } from '@/lib/api'

// Minimal D1 shim for testing rate limit logic
function makeDb(_initialCount = 0, _resetAt = 0): D1Database {
  const rows: Record<string, { count: number; reset_at: number }> = {}

  const db = {
    prepare: (_sql: string) => ({
      bind: (...args: any[]) => ({
        first: async <T>(): Promise<T | null> => {
          const key = args[0] as string
          const newCount = args[1] as number // reset_at for INSERT
          const now = args[2] as number

          if (!rows[key] || rows[key].reset_at <= now) {
            rows[key] = { count: 1, reset_at: newCount }
            return { count: 1 } as unknown as T
          }
          rows[key].count++
          return { count: rows[key].count } as unknown as T
        },
      }),
    }),
  } as unknown as D1Database

  return db
}

describe('rateLimit', () => {
  it('allows requests within limit', async () => {
    const db = makeDb()
    // limit of 3 per 60s
    expect(await rateLimit(db, 'test-key', 3, 60)).toBe(true)
    expect(await rateLimit(db, 'test-key', 3, 60)).toBe(true)
    expect(await rateLimit(db, 'test-key', 3, 60)).toBe(true)
  })

  it('blocks requests over limit', async () => {
    const db = makeDb()
    await rateLimit(db, 'limit-key', 2, 60) // count 1
    await rateLimit(db, 'limit-key', 2, 60) // count 2
    const result = await rateLimit(db, 'limit-key', 2, 60) // count 3 > limit 2
    expect(result).toBe(false)
  })

  it('different keys have independent counters', async () => {
    const db = makeDb()
    await rateLimit(db, 'key-a', 1, 60) // exhausts key-a
    const b = await rateLimit(db, 'key-b', 1, 60) // key-b is fresh
    expect(b).toBe(true)
  })

  it('returns true when DB throws (graceful degradation)', async () => {
    const badDb = {
      prepare: () => ({
        bind: () => ({
          first: async () => {
            throw new Error('DB error')
          },
        }),
      }),
    } as unknown as D1Database

    const result = await rateLimit(badDb, 'any', 5, 60)
    expect(result).toBe(true) // fail open — never block users due to DB error
  })
})
