'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'

type Order = { id: number; created_at: string; status: string; total: number; items?: unknown[] }

export default function OrdersPage() {
  const { user, ready } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ready && !user) {
      router.replace('/login')
      return
    }
    if (!ready || !user) return

    const token = localStorage.getItem('vms_token')
    fetch('/api/orders', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        if (r.status === 401) {
          router.replace('/login')
          return null
        }
        return r.json()
      })
      .then(d => {
        if (d) setOrders((d as { orders?: Order[] }).orders ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ready, user, router])

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--page-pt) max(32px, 4vw) var(--page-pb)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <PageHeader label="My Account" title="My Orders" className="mb-10" />

        {loading ? (
          <SkeletonList count={3} height={100} />
        ) : orders.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="No orders yet"
            description="Browse our catalogue and place your first order."
            action={{ href: '/products', label: 'Shop Now' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(o => (
              <div
                key={o.id}
                className="glass"
                style={{
                  borderRadius: 16,
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#e8f4fd',
                      marginBottom: 6,
                    }}
                  >
                    Order #{o.id}
                  </div>
                  <div style={{ fontSize: 13, color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>
                    {new Date(o.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: 800,
                      fontSize: 18,
                      color: '#00c2ff',
                    }}
                  >
                    ₹{(o.total / 100).toFixed(2)}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
