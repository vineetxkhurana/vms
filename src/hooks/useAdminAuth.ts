'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Returns { token, ready } for admin pages.
 * - `token` is the JWT from localStorage (or '' if absent)
 * - `ready` flips true once the check runs client-side
 * - Automatically redirects to /login if no token is present
 *
 * Also exports `adminFetch`: a fetch wrapper that automatically redirects
 * to /login on 401/403 responses.
 */
export function useAdminAuth() {
  const [token, setToken] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('vms_token')
    if (!t) {
      router.push('/login?next=' + encodeURIComponent(window.location.pathname))
      return
    }
    setToken(t)
    setReady(true)
  }, [router])

  const adminFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    })
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('vms_token')
      localStorage.removeItem('vms_user')
      router.push('/login?next=' + encodeURIComponent(window.location.pathname))
    }
    return res
  }

  return { token, ready, adminFetch }
}
