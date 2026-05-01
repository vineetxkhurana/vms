/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth 2.0 consent screen.
 */
export const runtime = 'edge'

async function getCfEnv(): Promise<Record<string, string>> {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages')
    return (getRequestContext().env as any) ?? {}
  } catch (_e) { /* not on Cloudflare */ }
  return {}
}

export async function GET(req: Request) {
  const env = await getCfEnv()
  const clientId = env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    const { origin } = new URL(req.url)
    return Response.redirect(`${origin}/login?error=oauth_misconfigured`)
  }

  const { origin } = new URL(req.url)
  const redirectUri = `${origin}/api/auth/google/callback`

  const stateBytes = new Uint8Array(24)
  crypto.getRandomValues(stateBytes)
  const state = Array.from(stateBytes, b => b.toString(16).padStart(2, '0')).join('')

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'online',
    prompt:        'select_account',
    state,
  })

  const res = Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  const headers = new Headers(res.headers)
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`)
  return new Response(res.body, { status: res.status, headers })
}
