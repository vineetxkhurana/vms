'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { UserRole } from '@/types'

const ALL_NAV = [
  { href: '/admin',          icon: 'dashboard',      label: 'Dashboard',  adminOnly: true  },
  { href: '/admin/products', icon: 'inventory_2',    label: 'Inventory',  adminOnly: false },
  { href: '/admin/orders',   icon: 'receipt_long',   label: 'Orders',     adminOnly: false },
  { href: '/admin/users',    icon: 'group',          label: 'Customers',  adminOnly: true  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path   = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<UserRole | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('vms_user')
    if (!raw) { router.push('/login'); return }
    const user = JSON.parse(raw) as { role: UserRole }
    if (!['admin', 'staff'].includes(user.role)) { router.push('/'); return }
    setRole(user.role)
  }, [router])

  const nav = ALL_NAV.filter(n => !n.adminOnly || role === 'admin')

  return (
    <div className="flex min-h-screen" style={{ background: '#050d1a' }}>
      <div className="dot-grid" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col flex-shrink-0 relative z-10"
        style={{ background: 'rgba(5,10,22,0.95)', borderRight: '1px solid rgba(0,194,255,0.1)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="p-6" style={{ borderBottom: '1px solid rgba(0,194,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <Image src="/vms-icon.svg" alt="VMS" width={36} height={36} style={{ flexShrink: 0 }} />
            <div>
              <p className="font-display font-black text-on-surface text-sm">VMS Admin</p>
              <p className="text-xs" style={{ color: '#8fafc7' }}>
                {role === 'admin' ? 'Owner' : role === 'staff' ? 'Staff' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {nav.map(({ href, icon, label }) => {
            const active = href === '/admin' ? path === href : path.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', borderRadius: 12,
                  background: active ? 'linear-gradient(135deg,rgba(0,194,255,0.15),rgba(124,58,237,0.15))' : 'transparent',
                  border: active ? '1px solid rgba(0,194,255,0.25)' : '1px solid transparent',
                  color: active ? '#e8f4fd' : '#8fafc7',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Icon name={icon} fill={active} className="text-[20px]" style={{ color: active ? '#00c2ff' : undefined }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(0,194,255,0.08)' }}>
          <button
            onClick={() => {
              localStorage.removeItem('vms_token')
              localStorage.removeItem('vms_user')
              // Clear auth cookie
              document.cookie = 'vms_token=; path=/; max-age=0'
              window.location.href = '/login'
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8fafc7', fontSize: 14, transition: 'color 0.2s' }}
            className="hover:text-red-400"
          >
            <Icon name="logout" className="text-[20px]" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto relative z-10" style={{ minHeight: '100vh' }}>
        <div className="page-enter" style={{ padding: '40px max(32px, 3vw)', maxWidth: 1400, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}


