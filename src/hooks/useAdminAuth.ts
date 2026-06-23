'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Admin auth hook - validates session via HttpOnly cookie.
 * `adminFetch`: a fetch wrapper that includes cookies and redirects on 401/403.
 */
export function useAdminAuth() {
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Validate cookie-based session server-side
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then((d: any) => {
        if (!d.user || !['admin', 'staff'].includes(d.user.role)) {
          router.push('/login?next=' + encodeURIComponent(window.location.pathname))
          return
        }
        setReady(true)
      })
      .catch(() => {
        router.push('/login?next=' + encodeURIComponent(window.location.pathname))
      })
  }, [router])

  const adminFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.headers ?? {}),
      },
    })
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('vms_user')
      router.push('/login?next=' + encodeURIComponent(window.location.pathname))
    }
    return res
  }

  return { ready, adminFetch }
}
