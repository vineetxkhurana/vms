'use client'
export const runtime = 'edge'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import type { Product } from '@/types'
import Image from 'next/image' // eslint-disable-line @typescript-eslint/no-unused-vars
import { Icon } from '@/components/ui/Icon'
import { AdminTable } from '@/components/admin/AdminTable'
import { useAdminAuth } from '@/hooks/useAdminAuth'

type Category = { id: number; name: string }

const EMPTY = {
  name: '',
  description: '',
  price: '',
  brand: 'other',
  stock: '',
  category_id: '',
  image_url: '',
  price_retailer: '',
  price_wholesaler: '',
  variant_group: '',
  variant_label: '',
  variant_type: 'none',
  batch_number: '',
  expiry_date: '',
  manufactured_date: '',
}

const VARIANT_TYPES = [
  { value: 'none', label: 'No variants' },
  { value: 'size', label: 'Size (e.g. 100ml / 500ml)' },
  { value: 'flavor', label: 'Flavour / Scent' },
  { value: 'color', label: 'Colour' },
  { value: 'pack', label: 'Pack size' },
]

/** Inline stock editor — click the number to edit, Enter/blur to save */
function StockCell({
  product,
  adminFetch,
  onSaved,
}: {
  product: Product
  adminFetch: (url: string, opts?: RequestInit) => Promise<Response>
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(product.stock))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const n = Number(val)
    if (isNaN(n) || n < 0 || n === product.stock) {
      setEditing(false)
      setVal(String(product.stock))
      return
    }
    setSaving(true)
    const res = await adminFetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: n }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(`Stock updated to ${n}`)
      setEditing(false)
      onSaved()
    } else {
      toast.error('Save failed')
      setVal(String(product.stock))
      setEditing(false)
    }
  }

  if (editing)
    return (
      <input
        type="number"
        min={0}
        value={val}
        autoFocus
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') {
            setEditing(false)
            setVal(String(product.stock))
          }
        }}
        style={{
          width: 60,
          padding: '3px 7px',
          borderRadius: 7,
          border: '1px solid rgba(0,194,255,0.4)',
          background: 'rgba(0,194,255,0.06)',
          color: '#e8f4fd',
          fontSize: 13,
          fontWeight: 700,
          outline: 'none',
        }}
      />
    )

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to adjust stock"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          color: product.stock === 0 ? '#ef4444' : product.stock < 5 ? '#f59e0b' : '#e8f4fd',
        }}
      >
        {saving ? '…' : product.stock}
      </span>
      <Icon name="edit" className="text-[11px]" style={{ color: '#4a6480', opacity: 0.7 }} />
    </button>
  )
}

/** Returns a color based on expiry proximity */
function expiryColor(exp: string | null | undefined): string {
  if (!exp) return '#8fafc7'
  const expDate = new Date(exp + '-01')
  const now = new Date()
  const diffMonths =
    (expDate.getFullYear() - now.getFullYear()) * 12 + expDate.getMonth() - now.getMonth()
  if (diffMonths < 0) return '#f87171' // expired — red
  if (diffMonths <= 3) return '#fbbf24' // expiring soon — amber
  return '#4ade80' // ok — green
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { ready, adminFetch } = useAdminAuth()

  const load = async () => {
    setLoading(true)
    // Fetch all pages (admin needs to see every product, not just first 20)
    let all: Product[] = []
    let page = 1
    while (true) {
      const r = await adminFetch(`/api/products?page=${page}&limit=100`)
      const d = (await r.json()) as any
      const batch: Product[] = d.products ?? []
      all = all.concat(batch)
      if (batch.length < 20) break // last page
      page++
    }
    setProducts(all)
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    load()
    fetch('/api/categories')
      .then(r => r.json())
      .then((d: any) => setCategories(d.categories ?? []))
  }, [ready])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setPreviewUrl('')
    setModal(true)
    document.body.style.overflow = 'hidden'
  }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      brand: p.brand,
      price: String(p.price_base ? p.price_base / 100 : p.price / 100),
      stock: String(p.stock),
      category_id: String(p.category_id ?? ''),
      image_url: p.image_url ?? '',
      price_retailer: p.price_retailer ? String(p.price_retailer / 100) : '',
      price_wholesaler: p.price_wholesaler ? String(p.price_wholesaler / 100) : '',
      variant_group: p.variant_group ?? '',
      variant_label: p.variant_label ?? '',
      variant_type: p.variant_type ?? 'none',
      batch_number: p.batch_number ?? '',
      expiry_date: p.expiry_date ?? '',
      manufactured_date: p.manufactured_date ?? '',
    })
    setModal(true)
    setPreviewUrl('')
    document.body.style.overflow = 'hidden'
  }

  const [previewUrl, setPreviewUrl] = useState<string>('')

  const handleImageUpload = async (file: File) => {
    // Immediately show local preview via blob URL — no waiting for server
    const blob = URL.createObjectURL(file)
    setPreviewUrl(blob)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await adminFetch('/api/upload', { method: 'POST', body: fd })
      const d = (await res.json()) as any
      if (res.ok && d.url && !d.url.includes('placeholder')) {
        // Real R2 URL — use it and release the blob
        setForm(f => ({ ...f, image_url: d.url }))
        URL.revokeObjectURL(blob)
        setPreviewUrl('')
        toast.success('Image uploaded')
      } else {
        // R2 not set up — keep the local blob preview and store it as-is
        setForm(f => ({ ...f, image_url: blob }))
        toast.success('Image set (stored locally — configure R2 for persistence)')
      }
    } catch {
      toast.error('Upload failed')
      setPreviewUrl('')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    const toInt = (v: string) => (v ? Math.round(Number(v) * 100) : null)
    const payload = {
      ...form,
      price: Math.round(Number(form.price) * 100),
      stock: Number(form.stock),
      category_id: form.category_id ? Number(form.category_id) : null,
      price_retailer: toInt(form.price_retailer),
      price_wholesaler: toInt(form.price_wholesaler),
      variant_group: form.variant_type !== 'none' ? form.variant_group || null : null,
      variant_label: form.variant_type !== 'none' ? form.variant_label || null : null,
      variant_type: form.variant_type !== 'none' ? form.variant_type : null,
      batch_number: form.batch_number || null,
      expiry_date: form.expiry_date || null,
      manufactured_date: form.manufactured_date || null,
    }
    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PATCH' : 'POST'
    const res = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      toast.success(editing ? 'Updated' : 'Product added')
      setModal(false)
      document.body.style.overflow = ''
      load()
    } else {
      const d = (await res.json()) as any
      toast.error(d.error ?? 'Error')
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Hide this product from the store?')) return
    await adminFetch(`/api/products/${id}`, { method: 'DELETE' })
    toast.success('Product hidden')
    load()
  }

  const field = (key: keyof typeof EMPTY, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-on-surface-muted mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input-glass"
      />
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between mb-10">
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
            Catalogue
          </span>
          <h1
            className="font-display font-black text-on-surface mt-1"
            style={{ fontSize: 'clamp(22px,3vw,32px)' }}
          >
            Inventory{' '}
            <span className="text-on-surface-muted text-base font-normal">({products.length})</span>
          </h1>
        </div>
        <button
          onClick={openNew}
          className="cta-btn inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
        >
          <Icon name="add" /> Add Product
        </button>
      </div>

      <AdminTable
        headers={[
          'Product',
          'Brand',
          'Price',
          'Retailer',
          'Wholesaler',
          'Stock',
          'Expiry',
          'Status',
          'Actions',
        ]}
        skeletonCols={[140, 60, 60, 60, 60, 60, 60, 60]}
        skeletonRows={6}
        loading={loading}
        empty={products.length === 0}
        emptyIcon="inventory_2"
        emptyMessage="No products yet"
      >
        {products.map(p => (
          <tr
            key={p.id}
            style={{ borderBottom: '1px solid rgba(0,194,255,0.06)' }}
            className="hover:bg-white/[0.02] transition-colors"
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: p.image_url ? '#f0f4f8' : 'rgba(0,194,255,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      style={{ width: 40, height: 40, objectFit: 'contain', padding: 4 }}
                    />
                  ) : (
                    <Icon name="medication" fill className="text-on-surface-muted" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-on-surface line-clamp-1 text-sm">
                    {p.name}
                  </span>
                  {p.variant_label && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(124,58,237,0.12)',
                        color: '#a78bfa',
                        border: '1px solid rgba(124,58,237,0.2)',
                        marginTop: 2,
                        display: 'inline-block',
                      }}
                    >
                      {p.variant_label}
                    </span>
                  )}
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  background: p.brand === 'VMS' ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.04)',
                  border:
                    p.brand === 'VMS'
                      ? '1px solid rgba(0,229,160,0.25)'
                      : '1px solid rgba(255,255,255,0.08)',
                  color: p.brand === 'VMS' ? '#00e5a0' : '#8fafc7',
                }}
              >
                {p.brand}
              </span>
            </td>
            <td className="px-4 py-3 font-bold text-primary">₹{(p.price / 100).toFixed(0)}</td>
            <td className="px-4 py-3 text-on-surface-muted text-xs">
              {p.price_retailer ? `₹${(p.price_retailer / 100).toFixed(0)}` : '—'}
            </td>
            <td className="px-4 py-3 text-on-surface-muted text-xs">
              {p.price_wholesaler ? `₹${(p.price_wholesaler / 100).toFixed(0)}` : '—'}
            </td>
            <td className="px-4 py-3">
              <StockCell product={p} adminFetch={adminFetch} onSaved={load} />
            </td>
            <td
              className="px-4 py-3 text-xs font-mono"
              style={{ color: expiryColor(p.expiry_date) }}
            >
              {p.expiry_date ?? '—'}
            </td>
            <td className="px-4 py-3">
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                  background: p.is_active ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.08)',
                  border: p.is_active
                    ? '1px solid rgba(0,229,160,0.25)'
                    : '1px solid rgba(239,68,68,0.2)',
                  color: p.is_active ? '#00e5a0' : '#ef4444',
                }}
              >
                {p.is_active ? 'Active' : 'Hidden'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(p)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(0,194,255,0.06)',
                    border: '1px solid rgba(0,194,255,0.15)',
                    color: '#00c2ff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="edit" className="text-[16px]" />
                </button>
                <button
                  onClick={() => remove(p.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="delete" className="text-[16px]" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>

      {/* ── Add / Edit Modal — rendered via portal so fixed pos is always viewport-relative ── */}
      {modal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            onClick={() => {
              setModal(false)
              document.body.style.overflow = ''
            }}
          >
            <div
              className="glass rounded-3xl p-8 w-full max-w-2xl overflow-y-auto"
              style={{ maxHeight: 'calc(100dvh - 48px)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-7">
                <h2 className="font-display font-black text-on-surface text-xl">
                  {editing ? 'Edit Product' : 'Add Product'}
                </h2>
                <button
                  onClick={() => {
                    setModal(false)
                    document.body.style.overflow = ''
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#8fafc7',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="close" className="text-[18px]" />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* ── Image upload ── */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-muted mb-2 uppercase tracking-wide">
                    Product Image
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const f = e.dataTransfer.files[0]
                      if (f) handleImageUpload(f)
                    }}
                    style={{
                      border: '2px dashed rgba(0,194,255,0.25)',
                      borderRadius: 16,
                      padding: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      background: 'rgba(0,194,255,0.03)',
                      transition: 'border-color 0.2s',
                    }}
                    className="hover:border-primary/50"
                  >
                    {previewUrl || form.image_url ? (
                      <img
                        src={previewUrl || form.image_url}
                        alt="preview"
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          objectFit: 'contain',
                          background: 'rgba(255,255,255,0.04)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 12,
                          background: 'rgba(0,194,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="image" className="text-[28px] text-on-surface-muted" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {uploading ? 'Uploading…' : 'Click or drag to upload'}
                      </p>
                      <p className="text-xs text-on-surface-muted mt-0.5">
                        JPEG, PNG, WebP · max 5 MB
                      </p>
                      {(previewUrl || form.image_url) && !uploading && (
                        <p className="text-xs mt-1" style={{ color: '#00e5a0' }}>
                          ✓ Image set
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleImageUpload(f)
                    }}
                  />
                  {/* Fallback: paste URL */}
                  <input
                    type="text"
                    placeholder="…or paste an image URL"
                    value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="input-glass mt-2"
                    style={{ fontSize: 12, padding: '8px 14px' }}
                  />
                </div>

                {/* ── Basic info ── */}
                <div className="grid grid-cols-2 gap-4">
                  {field('name', 'Product Name', 'text', 'Paracetamol 500mg')}
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-muted mb-1.5 uppercase tracking-wide">
                      Brand
                    </label>
                    <select
                      value={form.brand}
                      onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                      className="input-glass"
                    >
                      <option value="other">Other / Generic</option>
                      <option value="VMS">VMS Generic</option>
                    </select>
                  </div>
                </div>

                {field('description', 'Description', 'text', 'Brief product description')}

                {/* ── Category ── */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-muted mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="input-glass"
                  >
                    <option value="">— Select category —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── Pricing & Stock ── */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-muted mb-3 uppercase tracking-wide">
                    Pricing &amp; Stock
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {field('price', 'Base Price (₹)', 'number', '49.00')}
                    {field('stock', 'Stock qty', 'number', '100')}
                    {field('price_retailer', 'Retailer Price (₹)', 'number', 'Optional')}
                    {field('price_wholesaler', 'Wholesaler Price (₹)', 'number', 'Optional')}
                  </div>
                </div>

                {/* ── Batch / Expiry ── */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-muted mb-1">
                      Batch Number
                    </label>
                    <input
                      value={form.batch_number ?? ''}
                      onChange={e => setForm(f => ({ ...f, batch_number: e.target.value }))}
                      className="input-glass text-sm"
                      placeholder="B2024001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-muted mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="month"
                      value={form.expiry_date ?? ''}
                      onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                      className="input-glass text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-muted mb-1">
                      Mfg. Date
                    </label>
                    <input
                      type="month"
                      value={form.manufactured_date ?? ''}
                      onChange={e => setForm(f => ({ ...f, manufactured_date: e.target.value }))}
                      className="input-glass text-sm"
                    />
                  </div>
                </div>

                {/* ── Variants ── */}
                <div style={{ borderTop: '1px solid rgba(0,194,255,0.1)', paddingTop: 20 }}>
                  <label
                    className="block text-xs font-semibold mb-3 uppercase tracking-wide"
                    style={{ color: '#a78bfa' }}
                  >
                    Variant Grouping{' '}
                    <span
                      style={{
                        color: '#8fafc7',
                        fontWeight: 400,
                        textTransform: 'none',
                        letterSpacing: 0,
                      }}
                    >
                      (optional — groups same products)
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-muted mb-1.5 uppercase tracking-wide">
                        Type
                      </label>
                      <select
                        value={form.variant_type}
                        onChange={e => setForm(f => ({ ...f, variant_type: e.target.value }))}
                        className="input-glass"
                      >
                        {VARIANT_TYPES.map(v => (
                          <option key={v.value} value={v.value}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {field('variant_group', 'Group slug', 'text', 'dettol-antiseptic')}
                    {field('variant_label', 'This variant', 'text', '500ml')}
                  </div>
                  {form.variant_type !== 'none' && (
                    <p className="text-xs text-on-surface-muted mt-2">
                      All products with the same <strong>group slug</strong> will be shown together.
                      The <strong>variant label</strong> is what distinguishes this product (e.g.
                      &quot;500ml&quot;, &quot;Orange&quot;).
                    </p>
                  )}
                </div>

                <button
                  onClick={save}
                  className="cta-btn w-full py-3.5 rounded-full font-bold text-white mt-1"
                  style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
                >
                  {editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
