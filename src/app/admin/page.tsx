'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { STATUS_CONFIG } from '@/lib/status'

type Stats = {
  orders:          { total: number }
  products:        { total: number; low_stock: number }
  users:           { total: number; retailers: number; wholesalers: number }
  revenue_paise:   number
  pending_paise:   number
  status_counts:   Record<string, number>
  low_stock_items: Array<{ id: number; name: string; stock: number }>
  recent_orders:   Array<{ id: number; total_paise: number; status: string; created_at: number; customer_name: string; email: string }>
}

function Stat({ icon, label, value, color, sub }: { icon: string; label: string; value: React.ReactNode; color: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-6 glass-hover transition-all duration-300 hover:-translate-y-1">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
        <Icon name={icon} fill className="text-[22px]" style={{ color }} />
      </div>
      <p className="font-display font-black text-on-surface text-2xl">{value}</p>
      <p className="text-sm text-on-surface-muted mt-0.5">{label}</p>
      <p className="text-xs mt-2 text-on-surface-muted">{sub}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const { ready, adminFetch } = useAdminAuth()

  const load = useCallback(() => {
    if (!ready) return
    setLoading(true)
    setError('')
    // cache: 'no-store' — always get live data, never a stale browser-cached response
    adminFetch('/api/admin/stats', { cache: 'no-store' } as RequestInit)
      .then(async r => {
        const d = await r.json()
        if (!r.ok) { setError((d as any).error ?? 'Failed to load stats'); return }
        setStats(d as Stats)
      })
      .catch(e => setError(e.message ?? 'Network error'))
      .finally(() => setLoading(false))
  }, [ready])

  // Fetch on mount and whenever the page becomes visible again
  // (covers navigating back from /admin/orders after advancing statuses)
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#00c2ff', textTransform: 'uppercase' }}>Overview</span>
          <h1 className="font-display font-black text-on-surface mt-2" style={{ fontSize: 'clamp(24px,3vw,36px)' }}>Dashboard</h1>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)', color: '#00c2ff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: loading ? 0.5 : 1 }}
        >
          <Icon name="refresh" className={`text-[16px] ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', marginBottom: 24, fontSize: 14 }}>
          <Icon name="error" className="text-[16px] mr-2" style={{ verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: 140 }} />
          ))
        ) : stats ? (
          <>
            <Stat icon="trending_up"   label="Confirmed Revenue" value={fmt(stats.revenue_paise)}  color="#00c2ff"
              sub={stats.pending_paise > 0 ? `+ ${fmt(stats.pending_paise)} pending` : 'paid orders only'} />
            <Stat icon="receipt_long"  label="Total Orders"      value={stats.orders.total}         color="#00e5a0"
              sub={`${stats.status_counts['processing'] ?? 0} processing · ${stats.status_counts['shipped'] ?? 0} shipped`} />
            <Stat icon="inventory_2"   label="Active Products"   value={stats.products.total}       color="#7c3aed"
              sub={`${stats.products.low_stock} low stock (< 5 units)`} />
            <Stat icon="group"         label="Customers"         value={stats.users.total}          color="#f59e0b"
              sub={`${stats.users.retailers} retailers · ${stats.users.wholesalers} wholesalers`} />
          </>
        ) : null}
      </div>

      {/* Order pipeline breakdown */}
      {stats && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-on-surface text-base mb-4">Order Pipeline</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => {
              const count = stats.status_counts[s] ?? 0
              return (
                <Link key={s} href={`/admin/orders?status=${s}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`, cursor: 'pointer' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: cfg.color, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{count}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#8fafc7' }}>{cfg.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Recent orders */}
        {stats && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-on-surface text-base">Recent Orders</h2>
              <Link href="/admin/orders" style={{ fontSize: 12, color: '#00c2ff', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>
            {stats.recent_orders.length === 0 ? (
              <p className="text-on-surface-muted text-sm">No orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.recent_orders.map(o => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,194,255,0.04)', border: '1px solid rgba(0,194,255,0.08)' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#00c2ff', fontSize: 13 }}>#{o.id}</span>
                        <span style={{ marginLeft: 10, fontSize: 13, color: '#e8f4fd', fontWeight: 500 }}>{o.customer_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e8f4fd' }}>{fmt(o.total_paise)}</span>
                        <StatusBadge status={o.status} size="sm" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Low stock alert — only render when there are actually items below threshold */}
        {stats && stats.low_stock_items.length > 0 && (
          <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-on-surface text-base">
                <Icon name="warning" fill className="text-[16px] mr-2" style={{ color: '#f59e0b', verticalAlign: 'middle' }} />
                Low Stock Alert
              </h2>
              <Link href="/admin/products" style={{ fontSize: 12, color: '#00c2ff', textDecoration: 'none', fontWeight: 600 }}>Restock →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.low_stock_items.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 10, background: p.stock === 0 ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${p.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}` }}>
                  <span style={{ fontSize: 13, color: '#e8f4fd', fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: p.stock === 0 ? '#ef4444' : '#f59e0b' }}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mb-4">
        <h2 className="font-display font-bold text-on-surface text-lg">Quick Actions</h2>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/orders',   icon: 'receipt_long',    label: 'Manage Orders',    desc: 'Update order statuses, track shipments' },
          { href: '/admin/products', icon: 'inventory_2',     label: 'Add Products',     desc: 'Add or edit catalogue items & pricing' },
          { href: '/admin/users',    icon: 'manage_accounts', label: 'Manage Customers', desc: 'Set customer tiers & retailer/wholesaler accounts' },
        ].map(({ href, icon, label, desc }) => (
          <a key={href} href={href} className="glass glass-hover rounded-2xl p-6 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1" style={{ textDecoration: 'none' }}>
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}>
              <Icon name={icon} fill className="text-primary text-[20px]" />
            </div>
            <div>
              <p className="font-semibold text-on-surface text-sm">{label}</p>
              <p className="text-xs text-on-surface-muted mt-1 leading-relaxed">{desc}</p>
            </div>
          </a>
        ))}
      </div>
    </>
  )
}
