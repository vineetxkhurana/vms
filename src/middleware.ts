/**
 * Edge middleware — protects /admin/* routes via JWT verification + logs all requests.
 */
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import * as Sentry from '@sentry/nextjs'

const COOKIE = 'vms_token'

function jwtSecret() {
  const s = process.env.JWT_SECRET
  if (!s) return null
  return new TextEncoder().encode(s)
}

export async function middleware(req: NextRequest) {
  const start = Date.now()
  const { pathname } = req.nextUrl as any
  const reqMethod = req.method

  try {
    let response: NextResponse

    // ── Admin guard — verify JWT signature + role ─────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      const token = req.cookies.get(COOKIE)?.value
        ?? req.headers.get('authorization')?.replace('Bearer ', '')
      const secret = jwtSecret()

      if (!token || !secret) {
        response = pathname.startsWith('/api/')
          ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          : NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url))
      } else {
        try {
          const { payload } = await jwtVerify(token, secret)
          if (!['admin', 'staff'].includes(payload.role as string)) {
            response = pathname.startsWith('/api/')
              ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
              : NextResponse.redirect(new URL('/', req.url))
          } else {
            response = NextResponse.next()
          }
        } catch {
          response = pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            : NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url))
        }
      }
    } else {
      response = NextResponse.next()
    }

    // ── Structured request log ───────────────────────────────────
    const latency = Date.now() - start
    console.warn(JSON.stringify({
      level: 'info',
      ts: new Date().toISOString(),
      method: reqMethod,
      path: pathname,
      status: response.status,
      latency_ms: latency,
      cf_ray: req.headers.get('cf-ray') ?? undefined,
      country: req.headers.get('cf-ipcountry') ?? undefined,
    }))

    // Add breadcrumb for Sentry session context
    Sentry.addBreadcrumb({
      category: 'http.request',
      message: `${reqMethod} ${pathname}`,
      data: { latency_ms: latency, status: response.status },
      level: 'info',
    })

    return response
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), method: reqMethod, path: pathname, error: String(err) }))
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
