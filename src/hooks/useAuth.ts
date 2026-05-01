'use client'
import { useState, useEffect } from 'react'

export type AuthUser = {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('vms_user')
        setUser(raw ? (JSON.parse(raw) as AuthUser) : null)
      } catch {
        setUser(null)
      }
      setReady(true)
    }
    load()
    // Sync across tabs / same-tab login
    window.addEventListener('storage', load)
    return () => window.removeEventListener('storage', load)
  }, [])

  const signOut = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { /* best-effort */ }
    localStorage.removeItem('vms_token')
    localStorage.removeItem('vms_user')
    setUser(null)
    window.location.href = '/'
  }

  return { user, ready, signOut }
}
