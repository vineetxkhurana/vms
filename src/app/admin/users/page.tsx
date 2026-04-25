'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Icon } from '@/components/ui/Icon'
import { AdminTable } from '@/components/admin/AdminTable'
import type { UserRole } from '@/types'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const TIERS: UserRole[] = ['customer', 'retailer', 'wholesaler']
const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  customer:   { color: '#8fafc7', bg: 'rgba(143,175,199,0.1)', label: 'Customer' },
  retailer:   { color: '#00c2ff', bg: 'rgba(0,194,255,0.1)',   label: 'Retailer' },
  wholesaler: { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  label: 'Wholesaler' },
}

type User = { id: number; email: string | null; phone: string | null; name: string; role: UserRole; is_verified: number; created_at: number }

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [filter, setFilter]   = useState('')
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const { ready, adminFetch } = useAdminAuth()

  const load = (role = '', q = '') => {
    setLoading(true)
    const params = new URLSearchParams()
    if (role) params.set('role', role)
    if (q)    params.set('search', q)
    adminFetch(`/api/admin/users?${params}`)
      .then(r => r.ok ? r.json() : { users: [] })
      .then((d: any) => { setUsers(d.users ?? []); setLoading(false) })
  }

  useEffect(() => { if (ready) load(filter, search) }, [filter, ready])
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => load(filter, search), 300)
    return () => clearTimeout(t)
  }, [search, ready])

  const updateTier = async (id: number, role: UserRole) => {
    const res = await adminFetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    if (res.ok) { toast.success('Tier updated'); load(filter, search) }
    else toast.error('Update failed')
  }

  return (
    <>
      <div className="flex items-center justify-between mb-10">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#00c2ff', textTransform: 'uppercase' }}>CRM</span>
          <h1 className="font-display font-black text-on-surface mt-1" style={{ fontSize: 'clamp(22px,3vw,32px)' }}>
            Customers <span className="text-on-surface-muted text-base font-normal">({users.length})</span>
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-8">
        {/* Search */}
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Icon name="search" className="text-[18px] text-on-surface-muted" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="input-glass"
            style={{ paddingLeft: 42 }}
          />
        </div>
        {/* Tier filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('')}
            style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: !filter ? 'linear-gradient(135deg,#00c2ff,#7c3aed)' : 'rgba(10,20,45,0.7)', color: !filter ? '#fff' : '#8fafc7', border: `1px solid ${!filter ? 'transparent' : 'rgba(0,194,255,0.2)'}` }}
          >All</button>
          {TIERS.map(t => (
            <button
              key={t}
              onClick={() => setFilter(filter === t ? '' : t)}
              style={{ padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: filter === t ? TIER_CONFIG[t].bg : 'rgba(10,20,45,0.7)', color: filter === t ? TIER_CONFIG[t].color : '#8fafc7', border: `1px solid ${filter === t ? TIER_CONFIG[t].color + '50' : 'rgba(0,194,255,0.2)'}` }}
            >
              {TIER_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      <AdminTable
        headers={['Customer', 'Contact', 'Tier', 'Verified', 'Joined', 'Change Tier']}
        skeletonCols={[120, 80, 80, 40, 80, 100]}
        skeletonRows={6}
        loading={loading}
        empty={users.length === 0}
        emptyIcon="group"
        emptyMessage="No customers found"
      >
        {users.map(u => {
          const cfg = TIER_CONFIG[u.role] ?? TIER_CONFIG.customer
          return (
            <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,194,255,0.06)' }} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.color}40`, color: cfg.color }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-on-surface">{u.name}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <p className="text-on-surface-muted text-xs">{u.email ?? '—'}</p>
                <p className="text-on-surface-muted text-xs">{u.phone ?? '—'}</p>
              </td>
              <td className="px-5 py-4">
                <span style={{ padding: '3px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: cfg.bg, border: `1px solid ${cfg.color}40`, color: cfg.color }}>
                  {cfg.label}
                </span>
              </td>
              <td className="px-5 py-4">
                {u.is_verified
                  ? <Icon name="verified" fill className="text-secondary text-[18px]" />
                  : <Icon name="schedule" className="text-on-surface-muted text-[18px]" />}
              </td>
              <td className="px-5 py-4 text-on-surface-muted text-xs">
                {new Date(u.created_at * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
              <td className="px-5 py-4">
                <select value={u.role} onChange={e => updateTier(u.id, e.target.value as UserRole)}
                  className="input-glass text-xs" style={{ padding: '6px 12px', width: 'auto' }}>
                  {TIERS.map(t => <option key={t} value={t}>{TIER_CONFIG[t].label}</option>)}
                </select>
              </td>
            </tr>
          )
        })}
      </AdminTable>
    </>
  )
}
