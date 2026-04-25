// Cloudflare D1 binding — accessed via request context
export type Env = {
  DB: D1Database
  BUCKET: R2Bucket
  JWT_SECRET: string
  RAZORPAY_KEY_ID: string
  RAZORPAY_KEY_SECRET: string
}

export function getDB(request: Request): D1Database {
  return (request as any).cf?.env?.DB ?? (globalThis as any).__D1__
}
