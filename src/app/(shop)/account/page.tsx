'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Icon } from '@/components/ui/Icon'

export default function AccountPage() {
  const { user, ready, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, user, router])

  if (!ready || !user) return null

  const initials = user.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--page-pt) max(24px, 4vw) var(--page-pb)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Avatar + name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              fontFamily: 'Manrope, sans-serif',
              boxShadow: '0 8px 32px rgba(0,194,255,0.25)',
            }}
          >
            {initials}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 800,
                fontSize: 22,
                color: '#e8f4fd',
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#8fafc7',
                fontFamily: 'Inter, sans-serif',
                marginTop: 4,
              }}
            >
              {user.email ?? user.phone}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: 8,
                padding: '3px 12px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'capitalize',
                background: 'rgba(0,194,255,0.1)',
                border: '1px solid rgba(0,194,255,0.25)',
                color: '#00c2ff',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: 1,
              }}
            >
              {user.role}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {[
            {
              href: '/orders',
              icon: 'receipt_long',
              label: 'My Orders',
              sub: 'Track and view past orders',
            },
            {
              href: '/cart',
              icon: 'shopping_cart',
              label: 'My Cart',
              sub: 'View items in your cart',
            },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 20px',
                borderRadius: 16,
                background: 'rgba(10,20,45,0.6)',
                border: '1px solid rgba(0,194,255,0.1)',
                textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: 'rgba(0,194,255,0.1)',
                  border: '1px solid rgba(0,194,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00c2ff',
                }}
              >
                <Icon name={item.icon} className="text-[22px]" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 700,
                    fontSize: 15,
                    color: '#e8f4fd',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#8fafc7',
                    fontFamily: 'Inter, sans-serif',
                    marginTop: 2,
                  }}
                >
                  {item.sub}
                </div>
              </div>
              <Icon name="chevron_right" style={{ color: '#4a6480' }} />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 100,
            cursor: 'pointer',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
            fontWeight: 700,
            fontSize: 15,
            fontFamily: 'Manrope, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Icon name="logout" className="text-[20px]" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
