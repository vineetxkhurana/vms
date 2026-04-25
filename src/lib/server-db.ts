/**
 * Server-side DB accessor for use in Server Components and Server Actions.
 *
 * - In Cloudflare Pages production: uses getRequestContext().env.DB
 * - In local `next dev`: uses the better-sqlite3 shim
 *
 * Never import this in client components or API routes (use getDB(req) there).
 */
export async function getServerDB(): Promise<any> {
  if (process.env.CF_PAGES) {
    try {
      const { getRequestContext } = await import('@cloudflare/next-on-pages')
      return (getRequestContext().env as any).DB ?? null
    } catch {
      return null
    }
  }
  if (process.env.NODE_ENV === 'development') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getLocalDB } = require('./local-db') as { getLocalDB: () => any }
      return getLocalDB()
    } catch {
      return null
    }
  }
  return null
}
