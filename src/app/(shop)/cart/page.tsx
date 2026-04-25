'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { calcTotals } from '@/lib/pricing'

export default function CartPage() {
  const { items, update, remove } = useCart()
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const { gst, delivery, total } = calcTotals(subtotal)
  const fmt = (p: number) => (p / 100).toFixed(2)

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, padding: '0 32px' }}>
        <div style={{ fontSize: 72 }}>🛒</div>
        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 28, color: '#e8f4fd' }}>Your cart is empty</h2>
        <p style={{ color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>Add medicines or healthcare products to get started.</p>
        <Link href="/products" style={{ padding: '14px 32px', borderRadius: 100, background: 'linear-gradient(135deg, #00c2ff, #7c3aed)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>Browse Products</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 max(32px, 4vw)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#00c2ff', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Checkout</span>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)', color: '#e8f4fd', marginTop: 8, marginBottom: 40 }}>Your Cart</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

          {/* ── Items list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map(item => (
              <div key={item.product.id} style={{ background: 'rgba(10,20,45,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,194,255,0.12)', borderRadius: 16, padding: '20px 24px', display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, background: 'rgba(0,194,255,0.06)', borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  {item.product.image_url
                    ? <Image src={item.product.image_url} alt={item.product.name} fill style={{ objectFit: 'contain', padding: 8 }} />
                    : <span style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>💊</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 15, color: '#e8f4fd', marginBottom: 4, lineHeight: 1.3 }}>{item.product.name}</div>
                  {/* Variant badge */}
                  {item.product.variant_label && (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif', background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa', marginBottom: 6 }}>
                      {item.product.variant_label}
                    </span>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#00c2ff', fontFamily: 'Manrope, sans-serif' }}>₹{fmt(item.product.price)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)', borderRadius: 100, padding: '4px 8px' }}>
                    <button onClick={() => update(item.product.id, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', color: '#00c2ff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#e8f4fd', fontFamily: 'Manrope, sans-serif' }}>{item.quantity}</span>
                    <button onClick={() => update(item.product.id, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', color: '#00c2ff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <button onClick={() => remove(item.product.id)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order summary ── */}
          <div style={{ background: 'rgba(10,20,45,0.7)', backdropFilter: 'blur(18px)', border: '1px solid rgba(0,194,255,0.15)', borderRadius: 20, padding: '32px 28px', position: 'sticky', top: 100 }}>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 20, color: '#e8f4fd', marginBottom: 28 }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Subtotal',   value: `₹${fmt(subtotal)}` },
                { label: 'Delivery',   value: `₹${fmt(delivery)}` },
                { label: 'GST (5%)',   value: `₹${fmt(gst)}`,     muted: true },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>
                  <span>{row.label}</span>
                  <span style={{ color: '#e8f4fd', fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(0,194,255,0.12)', paddingTop: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, color: '#e8f4fd' }}>Total</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 22, color: '#00c2ff' }}>₹{fmt(total)}</span>
            </div>
            <Link href="/checkout" style={{ display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 100, background: 'linear-gradient(135deg, #00c2ff, #7c3aed)', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', fontFamily: 'Manrope, sans-serif', boxShadow: '0 16px 48px rgba(0,194,255,0.3)' }} className="cta-btn">Proceed to Checkout →</Link>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#8fafc7', marginTop: 12, fontFamily: 'Inter, sans-serif' }}>Free returns · Secure payment</p>
          </div>
        </div>
      </div>
    </div>
  )
}

