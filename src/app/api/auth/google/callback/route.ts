/**
 * GET /api/auth/google/callback
 * Handles the redirect from Google, exchanges the code for user info,
 * and finds or creates the user in the DB before issuing a VMS JWT.
 */
import { NextResponse } from 'next/server'
import { getDB } from '@/lib/api'
import { signToken } from '@/lib/auth'
import type { UserRole } from '@/types'

export const runtime = 'edge'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  name: string
  picture?: string
  email_verified: boolean
}

async function getCfEnv(): Promise<Record<string, string>> {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages')
    return (getRequestContext().env as any) ?? {}
  } catch (_e) {
    /* not on Cloudflare */
  }
  return {}
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=google_cancelled`)
  }

  // Validate OAuth state to prevent CSRF
  const cookieHeader = req.headers.get('cookie') ?? ''
  const stateMatch = cookieHeader.match(/oauth_state=([^;]+)/)
  const savedState = stateMatch?.[1]
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${origin}/login?error=google_cancelled`)
  }

  const env = await getCfEnv()
  const clientId = env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID
  const clientSecret = env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=oauth_misconfigured`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/login?error=google_token_failed`)
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse

  // Fetch user profile from Google
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(`${origin}/login?error=google_profile_failed`)
  }

  const profile = (await profileRes.json()) as GoogleUserInfo

  if (!profile.email_verified) {
    return NextResponse.redirect(`${origin}/login?error=google_email_unverified`)
  }

  const db = await getDB(req)
  if (!db) {
    return NextResponse.redirect(`${origin}/login?error=db_unavailable`)
  }

  // Find existing user by google_id OR email (link accounts)
  let user = await db
    .prepare(
      'SELECT id, email, phone, name, role FROM users WHERE google_id = ? OR email = ? LIMIT 1',
    )
    .bind(profile.sub, profile.email)
    .first<{
      id: number
      email: string | null
      phone: string | null
      name: string
      role: UserRole
    }>()

  if (!user) {
    user = await db
      .prepare(
        `INSERT INTO users (email, name, google_id, is_verified)
         VALUES (?, ?, ?, 1)
         RETURNING id, email, phone, name, role`,
      )
      .bind(profile.email, profile.name, profile.sub)
      .first<{
        id: number
        email: string | null
        phone: string | null
        name: string
        role: UserRole
      }>()
  } else {
    await db
      .prepare('UPDATE users SET google_id = ?, is_verified = 1 WHERE id = ?')
      .bind(profile.sub, user.id)
      .run()
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=user_creation_failed`)
  }

  const token = await signToken({
    sub: String(user.id),
    email: user.email ?? null,
    phone: user.phone ?? null,
    role: user.role,
    name: user.name,
  })

  const destination = ['admin', 'staff'].includes(user.role) ? '/admin' : '/'
  const res = NextResponse.redirect(`${origin}${destination}`)
  res.cookies.set('vms_token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 7,
  })
  res.cookies.set('vms_token_pub', token, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    maxAge: 60,
  })
  res.cookies.set('oauth_state', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 0,
  })
  return res
}
