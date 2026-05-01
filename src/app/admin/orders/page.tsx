'use client'
export const runtime = 'edge'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AdminTable } from '@/components/admin/AdminTable'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { STATUS_CONFIG, PIPELINE } from '@/lib/status'

function StatusPipeline({
  current,
  onAdvance,
  onCancel,
}: {
  current: string
  onAdvance: () => void
  onCancel: () => void
}) {
  const idx = PIPELINE.indexOf(current as (typeof PIPELINE)[number])
  const canAdvance = idx >= 0 && idx < PIPELINE.length - 1
  const next = canAdvance ? PIPELINE[idx + 1] : null
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-1 items-center mr-2">
        {PIPELINE.map((s, i) => (
          <div
            key={s}
            style={{
              width: i === idx ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i <= idx ? STATUS_CONFIG[s].color : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
      {canAdvance && next && (
        <button
          onClick={onAdvance}
          title={`Mark as ${STATUS_CONFIG[next].label}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            background: `${STATUS_CONFIG[next].color}18`,
            border: `1px solid ${STATUS_CONFIG[next].color}40`,
            color: STATUS_CONFIG[next].color,
            whiteSpace: 'nowrap',
          }}
        >
          <Icon name="arrow_forward" className="text-[13px]" />
          {STATUS_CONFIG[next].label}
        </button>
      )}
      {current !== 'cancelled' && current !== 'delivered' && (
        <button
          onClick={onCancel}
          title="Cancel order"
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" className="text-[13px]" />
        </button>
      )}
    </div>
  )
}

type OrderItem = {
  product_id: number
  product_name: string
  quantity: number
  price_paise: number
  variant_label: string | null
  variant_type: string | null
  image_url: string | null
}

function OrderItemsRow({
  orderId,
  adminFetch,
}: {
  orderId: number
  adminFetch: (url: string, opts?: RequestInit) => Promise<Response>
}) {
  const [items, setItems] = useState<OrderItem[] | null>(null)

  useEffect(() => {
    adminFetch(`/api/admin/orders?order_id=${orderId}`)
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then((d: any) => setItems(d.items ?? []))
  }, [orderId])

  if (!items)
    return (
      <tr>
        <td colSpan={6} style={{ padding: '10px 24px', background: 'rgba(0,194,255,0.02)' }}>
          <div className="skeleton rounded-lg" style={{ height: 16, width: 200 }} />
        </td>
      </tr>
    )

  return (
    <tr>
      <td
        colSpan={6}
        style={{
          padding: '10px 24px 16px',
          background: 'rgba(0,194,255,0.025)',
          borderBottom: '1px solid rgba(0,194,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(0,194,255,0.06)',
                border: '1px solid rgba(0,194,255,0.12)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e8f4fd' }}>
                {item.product_name}
              </span>
              {item.variant_label && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 6,
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    color: '#a78bfa',
                  }}
                >
                  {item.variant_label}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#8fafc7' }}>× {item.quantity}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00e5a0' }}>
                ₹{((item.price_paise * item.quantity) / 100).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </td>
    </tr>
  )
}

function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState(searchParams.get('status') ?? '')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const { ready, adminFetch } = useAdminAuth()

  const load = useCallback(
    (s = filter) => {
      if (!ready) return
      setLoading(true)
      adminFetch(`/api/admin/orders${s ? `?status=${s}` : ''}`)
        .then(r => (r.ok ? r.json() : { orders: [], total: 0 }))
        .then((d: any) => {
          setOrders(d.orders ?? [])
          setTotal(d.total ?? 0)
        })
        .finally(() => setLoading(false))
    },
    [ready, filter],
  )

  useEffect(() => {
    if (ready) load(filter)
  }, [filter, ready])

  const updateStatus = async (id: number, status: string) => {
    const res = await adminFetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      toast.success(`Order #${id} → ${status}`)
      load(filter)
    } else toast.error('Update failed')
  }

  const advance = (o: any) => {
    const idx = PIPELINE.indexOf(o.status)
    if (idx < PIPELINE.length - 1) updateStatus(o.id, PIPELINE[idx + 1])
  }

  const toggleExpand = (id: number) =>
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
              color: '#00c2ff',
              textTransform: 'uppercase',
            }}
          >
            Manage
          </span>
          <h1
            className="font-display font-black text-on-surface mt-1"
            style={{ fontSize: 'clamp(22px,3vw,32px)' }}
          >
            Orders{' '}
            {!loading && (
              <span className="text-on-surface-muted text-base font-normal">({total})</span>
            )}
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('')}
            style={{
              padding: '7px 16px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: !filter
                ? 'linear-gradient(135deg,#00c2ff,#7c3aed)'
                : 'rgba(10,20,45,0.7)',
              color: !filter ? '#fff' : '#8fafc7',
              border: `1px solid ${!filter ? 'transparent' : 'rgba(0,194,255,0.2)'}`,
            }}
          >
            All
          </button>
          {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? '' : s)}
              style={{
                padding: '7px 16px',
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: filter === s ? `${cfg.color}18` : 'rgba(10,20,45,0.7)',
                color: filter === s ? cfg.color : '#8fafc7',
                border: `1px solid ${filter === s ? cfg.color + '50' : 'rgba(0,194,255,0.2)'}`,
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      <AdminTable
        headers={['', 'Order', 'Customer', 'Amount', 'Status', 'Date', 'Pipeline']}
        skeletonCols={[20, 60, 120, 80, 100, 80, 140]}
        skeletonRows={5}
        loading={loading}
        empty={orders.length === 0}
        emptyIcon="receipt_long"
        emptyMessage="No orders found"
      >
        {orders.map(o => {
          const isOpen = expanded.has(o.id)
          return (
            <>
              <tr
                key={o.id}
                style={{
                  borderBottom: isOpen ? 'none' : '1px solid rgba(0,194,255,0.06)',
                  cursor: 'pointer',
                }}
                className="hover:bg-white/[0.02] transition-colors"
                onClick={() => toggleExpand(o.id)}
              >
                <td className="px-4 py-4">
                  <Icon
                    name={isOpen ? 'expand_less' : 'expand_more'}
                    className="text-[18px]"
                    style={{ color: '#4a6480' }}
                  />
                </td>
                <td className="px-4 py-4 font-mono font-bold text-primary text-sm">#{o.id}</td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-on-surface text-sm">{o.customer_name}</p>
                  <p className="text-xs text-on-surface-muted">{o.email ?? o.phone}</p>
                </td>
                <td className="px-4 py-4 font-black text-on-surface">
                  ₹{(o.total / 100).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={o.status} icon />
                </td>
                <td
                  className="px-4 py-4 text-on-surface-muted text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  {new Date(o.created_at * 1000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <StatusPipeline
                    current={o.status}
                    onAdvance={() => advance(o)}
                    onCancel={() => updateStatus(o.id, 'cancelled')}
                  />
                </td>
              </tr>
              {isOpen && (
                <OrderItemsRow key={`items-${o.id}`} orderId={o.id} adminFetch={adminFetch} />
              )}
            </>
          )
        })}
      </AdminTable>
    </>
  )
}

export default function AdminOrdersPageWrapper() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersPage />
    </Suspense>
  )
}
