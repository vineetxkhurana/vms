/**
 * POST /api/upload
 * Accepts multipart/form-data with a `file` field.
 * Dev: saves to /public/uploads/products/
 * Production (CF_PAGES): uploads to R2 bucket binding BUCKET
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'

export const runtime = process.env.CF_PAGES ? 'edge' : 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const user = await requireStaff(req)
  if (user instanceof NextResponse) return user

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || !file.name) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, GIF and AVIF images are allowed' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const key = `products/${slug}`

  if (process.env.CF_PAGES) {
    // Production: upload to R2
    try {
      const ctx = (await import('@cloudflare/next-on-pages')).getRequestContext()
      const bucket = (ctx.env as unknown as { BUCKET: R2Bucket }).BUCKET
      if (!bucket) throw new Error('R2 bucket binding not configured')
      const bytes = await file.arrayBuffer()
      await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } })
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vms.pages.dev'
      return NextResponse.json({ url: `${baseUrl}/cdn/${key}` })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  } else {
    // Dev: save to /public/uploads/products/
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const dir = join(process.cwd(), 'public', 'uploads', 'products')
    await mkdir(dir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(join(dir, slug), Buffer.from(bytes))
    return NextResponse.json({ url: `/uploads/products/${slug}` })
  }
}
