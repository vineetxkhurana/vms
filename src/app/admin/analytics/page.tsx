'use client'
export const runtime = 'edge'
import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { Icon } from '@/components/ui/Icon'

type FunnelRow = { event: string; count: number }
type DailyRow  = { day: string; count: number }
type TopPage   = { product_id: string; count: number }

type AnalyticsData = {
  funnel:       FunnelRow[]
  daily_orders: DailyRow[]
  top_products: TopPage[]
  total_events: number
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  product_view:      { label: 'Product Views',      icon: 'visibility',    color: '#00c2ff' },
  add_to_cart:       { label: 'Add to Cart',         icon: 'shopping_cart', color: '#7c3aed' },
  checkout_started:  { label: 'Checkout Started',    icon: 'payment',       color: '#f59e0b' },
  order_placed:      { label: 'Orders Placed',       icon: 'check_circle',  color: '#00e5a0' },
  user_registered:   { label: 'New Registrations',   icon: 'person_add',    color: '#ec4899' },
  login:             { label: 'Logins',              icon: 'login',         color: '#8fafc7' },
}

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [days, setDays]       = useState(7)
  const { ready, adminFetch } = useAdminAuth()

  const load = useCallback(() => {
    if (!ready) return
    setLoading(true)
    adminFetch(`/api/admin/analytics?days=${days}`)
      .then(async r => {
        const d = await r.json()
        if (!r.ok) { setError((d as any).error ?? 'Failed'); return }
        setData(d as AnalyticsData)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [ready, days, adminFetch])

  useEffect(() => { load() }, [load])

  const fmt = (n: number) => n.toLocaleString('en-IN')

  const views  = data?.funnel.find(f => f.event === 'product_view')?.count  ?? 0
  const orders = data?.funnel.find(f => f.event === 'order_placed')?.count  ?? 0
  const convRate = views > 0 ? ((orders / views) * 100).toFixed(1) : '—'

  return (
    <>
      <div className="flex items-center justify-between mb-10">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#00c2ff', textTransform: 'uppercase' }}>Insights</span>
          <h1 className="font-display font-black text-on-surface mt-2" style={{ fontSize: 'clamp(24px,3vw,36px)' }}>Analytics</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                borderColor: days === d ? '#00c2ff' : 'rgba(0,194,255,0.15)',
                background:  days === d ? 'rgba(0,194,255,0.1)' : 'transparent',
                color:       days === d ? '#00c2ff' : '#8fafc7' }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', marginBottom: 24, fontSize: 14 }}>{error}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading ? Array.from({length:4}).map((_,i) => <div key={i} className="skeleton rounded-2xl" style={{height:120}} />) : (
          <>
            {(['product_view','add_to_cart','order_placed','user_registered'] as const).map(ev => {
              const cfg = EVENT_LABELS[ev]
              const row = data?.funnel.find(f => f.event === ev)
              return (
                <div key={ev} className="glass rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${cfg.color}14`, border: `1px solid ${cfg.color}30` }}>
                    <Icon name={cfg.icon} fill className="text-[20px]" style={{ color: cfg.color }} />
                  </div>
                  <p className="font-display font-black text-on-surface text-2xl">{fmt(row?.count ?? 0)}</p>
                  <p className="text-sm text-on-surface-muted mt-0.5">{cfg.label}</p>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-on-surface text-base">Conversion Funnel</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#00e5a0', background: 'rgba(0,229,160,0.1)', padding: '3px 10px', borderRadius: 6 }}>
              {convRate}% CVR
            </span>
          </div>
          {loading ? <div className="skeleton rounded-xl" style={{height:160}} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['product_view','add_to_cart','checkout_started','order_placed'] as const).map((ev, idx, arr) => {
                const cfg = EVENT_LABELS[ev]
                const count  = data?.funnel.find(f => f.event === ev)?.count ?? 0
                const prev   = idx > 0 ? (data?.funnel.find(f => f.event === arr[idx-1])?.count ?? 0) : count
                const dropPct = prev > 0 ? Math.round((1 - count/prev)*100) : 0
                const barPct  = views > 0 ? Math.round((count/views)*100) : 0
                return (
                  <div key={ev}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#e8f4fd', fontWeight: 500 }}>{cfg.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{fmt(count)}
                        {idx > 0 && dropPct > 0 && <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 6 }}>−{dropPct}%</span>}
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, borderRadius: 3, background: cfg.color, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-on-surface text-base mb-5">Daily Orders ({days}d)</h2>
          {loading ? <div className="skeleton rounded-xl" style={{height:160}} /> : (
            data?.daily_orders && data.daily_orders.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
                {data.daily_orders.map(row => {
                  const max = Math.max(...data.daily_orders.map(r => r.count), 1)
                  const h   = Math.max((row.count / max) * 100, 4)
                  return (
                    <div key={row.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${row.day}: ${row.count} orders`}>
                      <div style={{ width: '100%', height: `${h}%`, borderRadius: 4, background: 'linear-gradient(180deg,#00c2ff,#7c3aed)', minHeight: 4 }} />
                      <span style={{ fontSize: 9, color: '#8fafc7', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
                        {row.day.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-on-surface-muted text-sm">No orders in this period yet.</p>
            )
          )}
        </div>
      </div>

      {data && data.top_products.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display font-bold text-on-surface text-base mb-4">Top Viewed Products</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.top_products.map((p, i) => (
              <div key={p.product_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,194,255,0.04)', border: '1px solid rgba(0,194,255,0.08)' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#00c2ff', width: 20 }}>#{i+1}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#e8f4fd' }}>Product #{p.product_id}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#00c2ff' }}>{fmt(p.count)} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && data?.total_events === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8fafc7' }}>
          <Icon name="analytics" className="text-[48px] mb-4" style={{ color: 'rgba(0,194,255,0.3)' }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>No events tracked yet</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Events will appear here once customers start visiting the store.</p>
        </div>
      )}
    </>
  )
}
