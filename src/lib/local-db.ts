/**
 * Local development D1 shim using better-sqlite3.
 * Activated automatically in `next dev` when no Cloudflare env is present.
 * Loaded via dynamic require path split in api.ts — never bundled for edge.
 *
 * Setup once: `npm run db:local`  → applies migrations to local SQLite
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

class LocalStatement {
  private sql: string
  private params: unknown[]
  private sqlite: any  // typed as any — this file is only loaded at Node.js runtime

  constructor(sqlite: any, sql: string, params: unknown[] = []) {
    this.sqlite = sqlite
    this.sql    = sql
    this.params = params
  }

  bind(...args: unknown[]): LocalStatement {
    return new LocalStatement(this.sqlite, this.sql, args)
  }

  async first<T>(): Promise<T | null> {
    try {
      const row = this.sqlite.prepare(this.sql).get(...(this.params as Parameters<typeof this.sqlite.prepare>)) 
      return (row as T) ?? null
    } catch (e) {
      console.error('[local-db] first() error:', e)
      throw e
    }
  }

  async run(): Promise<{ success: boolean; meta: Record<string, unknown>; results: unknown[] }> {
    try {
      const info = this.sqlite.prepare(this.sql).run(...(this.params as Parameters<typeof this.sqlite.prepare>))
      return {
        success: true,
        results: [],
        meta: { last_row_id: info.lastInsertRowid, changes: info.changes, duration: 0, rows_read: 0, rows_written: info.changes },
      }
    } catch (e) {
      console.error('[local-db] run() error:', e)
      throw e
    }
  }

  async all<T>(): Promise<{ success: boolean; results: T[]; meta: Record<string, unknown> }> {
    try {
      const stmt = this.sqlite.prepare(this.sql)
      // better-sqlite3: all() only works on SELECT — use run() for INSERT/UPDATE/DELETE
      if (stmt.reader) {
        const results = stmt.all(...(this.params as Parameters<typeof this.sqlite.prepare>)) as T[]
        return { success: true, results, meta: { last_row_id: 0, changes: 0, duration: 0, rows_read: results.length, rows_written: 0 } }
      } else {
        const info = stmt.run(...(this.params as Parameters<typeof this.sqlite.prepare>))
        return { success: true, results: [], meta: { last_row_id: info.lastInsertRowid, changes: info.changes, duration: 0, rows_read: 0, rows_written: info.changes } }
      }
    } catch (e) {
      console.error('[local-db] all() error:', e)
      throw e
    }
  }
}

class LocalDB {
  private sqlite: any

  constructor(sqlite: any) {
    this.sqlite = sqlite
  }

  prepare(sql: string): LocalStatement {
    return new LocalStatement(this.sqlite, sql)
  }

  async batch<T>(statements: LocalStatement[]): Promise<Array<{ success: boolean; results: T[] }>> {
    // Run each statement individually, using all() so SELECT returns rows
    const results: Array<{ success: boolean; results: T[] }> = []
    for (const s of statements) {
      const r = await s.all<T>()
      results.push({ success: r.success, results: r.results })
    }
    return results
  }

  async exec(query: string): Promise<{ count: number; duration: number }> {
    this.sqlite.exec(query)
    return { count: 1, duration: 0 }
  }
}

let _localDB: LocalDB | null = null

export function getLocalDB(): D1Database | null {
  if (process.env.NODE_ENV !== 'development') return null

  if (_localDB) return _localDB as unknown as D1Database

  try {
    const Database  = require('better-sqlite3')
    const path      = require('path')
    const fs        = require('fs')

    // Prefer wrangler's local D1 SQLite (created by `npm run db:local`)
    const wranglerDir = path.join(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject')
    let dbPath = path.join(process.cwd(), '.local/dev.sqlite')

    if (fs.existsSync(wranglerDir)) {
      const files = fs.readdirSync(wranglerDir).filter((f: string) => f.endsWith('.sqlite'))
      if (files.length > 0) dbPath = path.join(wranglerDir, files[0])
    } else {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    }

    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    _localDB = new LocalDB(sqlite)
    console.log(`[local-db] connected → ${dbPath}`)
    return _localDB as unknown as D1Database
  } catch (e) {
    console.warn('[local-db] better-sqlite3 unavailable, DB calls will 503. Run: npm run db:local')
    return null
  }
}
