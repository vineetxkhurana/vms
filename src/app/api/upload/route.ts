/**
 * POST /api/upload
 * Accepts multipart/form-data with a `file` field.
 * Uploads to R2 bucket (production) or returns placeholder URL (dev without R2).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'

export const runtime = 'edge'

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

  // Derive extension from validated MIME type, not user-supplied filename
  const MIME_EXT: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'image/avif': 'avif',
  }
  const ext = MIME_EXT[file.type]!
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const key = `products/${slug}`

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages')
    const ctx = getRequestContext()
    const bucket = (ctx.env as unknown as { BUCKET: R2Bucket }).BUCKET
    if (!bucket) throw new Error('R2 bucket not bound')
    const bytes = await file.arrayBuffer()
    await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } })
    return NextResponse.json({ url: `https://pub-47fdbf3013fa480eaa61d770e3686eaf.r2.dev/${key}` })
  } catch {
    // R2 not available — return SVG placeholder
    return NextResponse.json({ url: `/placeholder-product.svg` })
  }
}
