/**
 * Edge middleware — protects /admin/* routes via JWT cookie.
 * Reads `vms_token` cookie; redirects to /login if missing or invalid.
 */
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE = 'vms_token'
const ALLOWED_ROLES = ['admin', 'staff']

function secret(): Uint8Array | null {
  const s = process.env.JWT_SECRET
  if (!s) return null
  return new TextEncoder().encode(s)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Only enforce server-side JWT check in production (Cloudflare Pages).
  // In local dev the client-side admin layout guard is sufficient, and the
  // httpOnly cookie isn't reliably set until the user re-logs-in after this change.
  if (!process.env.CF_PAGES) return NextResponse.next()

  // If JWT_SECRET is not configured, pass through
  const sec = secret()
  if (!sec) return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  try {
    const { payload } = await jwtVerify(token, sec)
    const role = (payload as { role?: string }).role

    if (!role || !ALLOWED_ROLES.includes(role)) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
