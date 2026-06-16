'use client'
import { useState, useEffect, useCallback } from 'react'

export type AuthUser = {
  id: number
  name: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    // Read cached user from localStorage for instant UI, then validate via cookie
    try {
      const raw = localStorage.getItem('vms_user')
      if (raw) setUser(JSON.parse(raw) as AuthUser)
    } catch {
      /* ignore */
    }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then((d: any) => {
        const u = d.user as AuthUser | null
        setUser(u)
        if (u) {
          localStorage.setItem('vms_user', JSON.stringify(u))
        } else {
          localStorage.removeItem('vms_user')
        }
      })
      .catch(() => {
        /* offline — keep cached user */
      })
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [refresh])

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* best-effort */
    }
    localStorage.removeItem('vms_user')
    setUser(null)
    window.location.href = '/'
  }

  return { user, ready, signOut }
}
