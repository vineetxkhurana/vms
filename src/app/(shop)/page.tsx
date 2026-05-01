'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import ProductCard from '@/components/shop/ProductCard'
import { Icon } from '@/components/ui/Icon'
import type { Product } from '@/types'

const HeroScene = dynamic(() => import('@/components/ui/HeroScene'), { ssr: false })

type Category = { id: number; name: string }

// Icon + color for each category
const CAT_META: Record<string, { icon: string; color: string }> = {
  Medicines: { icon: 'medication', color: '#00c2ff' },
  'Vitamins & Supplements': { icon: 'nutrition', color: '#00e5a0' },
  'Skin Care': { icon: 'spa', color: '#7c3aed' },
  'Baby Care': { icon: 'child_care', color: '#00c2ff' },
  'First Aid': { icon: 'medical_services', color: '#00e5a0' },
  'Medical Devices': { icon: 'monitor_heart', color: '#7c3aed' },
  Ayurvedic: { icon: 'eco', color: '#00c2ff' },
  'Knee Support': { icon: 'accessibility_new', color: '#00e5a0' },
  'Back & Abdominal Support': { icon: 'airline_seat_recline_normal', color: '#7c3aed' },
  'Elbow & Arm Support': { icon: 'sports_martial_arts', color: '#00c2ff' },
  'Wrist & Hand Support': { icon: 'front_hand', color: '#00e5a0' },
  'Ankle & Foot Support': { icon: 'do_not_step', color: '#7c3aed' },
  'Cervical & Neck Support': { icon: 'person', color: '#00c2ff' },
  'Shoulder Support': { icon: 'sports_handball', color: '#00e5a0' },
  'Hot & Cold Therapy': { icon: 'thermostat', color: '#7c3aed' },
  'Bandages & Compression': { icon: 'healing', color: '#00c2ff' },
  'Body Massagers': { icon: 'self_improvement', color: '#00e5a0' },
  'Weighing Scales': { icon: 'scale', color: '#7c3aed' },
  'Memory Foam': { icon: 'king_bed', color: '#00c2ff' },
  'Mobility Aids': { icon: 'accessible', color: '#00e5a0' },
  'Surgical Instruments': { icon: 'biotech', color: '#7c3aed' },
}

const TRUST = [
  {
    icon: 'local_shipping',
    title: 'Fast Delivery',
    desc: '24–48 hr local delivery right to your doorstep.',
  },
  {
    icon: 'verified_user',
    title: '100% Genuine',
    desc: 'Direct sourcing from certified medical manufacturers only.',
  },
  {
    icon: 'support_agent',
    title: 'Expert Support',
    desc: 'Certified pharmacists available 24/7 for your consultation.',
  },
]

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?page=1&limit=8')
      .then(r => r.json())
      .then((d: any) => setProducts((d as { products?: Product[] }).products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch('/api/categories')
      .then(r => r.json())
      .then((d: any) => setCategories((d.categories ?? []) as Category[]))
      .catch(() => {})
  }, [])

  return (
    <>
      <main className="bg-background min-h-screen overflow-x-hidden">
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          {/* 3D background */}
          <div className="absolute inset-0 z-0">
            <HeroScene />
          </div>
          {/* Top fade — softens where helix enters */}
          <div
            className="absolute inset-x-0 top-0 z-[2] pointer-events-none"
            style={{
              height: 160,
              background: 'linear-gradient(to bottom, #050d1a 0%, transparent 100%)',
            }}
          />
          {/* Bottom fade — softens where helix exits */}
          <div
            className="absolute inset-x-0 bottom-0 z-[2] pointer-events-none"
            style={{
              height: 220,
              background: 'linear-gradient(to top, #050d1a 0%, transparent 100%)',
            }}
          />
          {/* Gradient overlay – fades into dark on the left */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, rgba(5,13,26,0.97) 0%, rgba(5,13,26,0.88) 42%, rgba(5,13,26,0.5) 68%, transparent 100%)',
            }}
          />
          {/* Dot grid */}
          <div className="dot-grid absolute inset-0 z-[1] pointer-events-none opacity-50" />

          {/* Content */}
          <div className="relative z-10 px-8 lg:px-24 py-32 max-w-4xl">
            {/* Badge */}
            <div
              className="slide-up inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.09)',
              }}
            >
              <span className="w-2 h-2 rounded-full bg-secondary live-dot inline-block flex-shrink-0" />
              <span className="text-xs font-semibold text-on-surface-muted tracking-[0.18em] uppercase">
                Established 1999 · Trusted Pharmacy
              </span>
            </div>

            {/* Headline */}
            <h1
              className="slide-up d1 font-display font-black text-on-surface leading-[0.92] tracking-tight mb-6"
              style={{ fontSize: 'clamp(52px, 8vw, 96px)' }}
            >
              Your Health,
              <br />
              <span className="grad-text glow-text">Our Priority.</span>
            </h1>

            <p className="slide-up d2 text-lg text-on-surface-muted max-w-lg mb-10 font-light leading-relaxed">
              Premium medicines &amp; healthcare essentials delivered to your doorstep. Trusted by
              500+ families since 1999.
            </p>

            {/* CTAs */}
            <div className="slide-up d3 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg"
                style={{
                  background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
                  boxShadow: '0 16px 48px rgba(0,194,255,0.3)',
                }}
              >
                Shop Now <Icon name="arrow_forward" />
              </Link>
              <Link
                href="/products?brand=VMS"
                className="ghost-btn inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg"
              >
                VMS Generics <Icon name="medication" />
              </Link>
            </div>

            {/* Stats row */}
            <div
              className="slide-up d4 flex flex-wrap gap-8 mt-16 pt-10"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {[
                ['50K+', 'Patients Served'],
                ['1999', 'Founded'],
                ['100%', 'Genuine'],
                ['24–48h', 'Delivery'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display font-black text-2xl grad-text">{n}</div>
                  <div className="text-xs text-on-surface-muted mt-1 tracking-wide uppercase">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ───────────────────────────────────── */}
        <section
          className="relative z-10 py-24 px-8 lg:px-24"
          style={{ background: 'rgba(5,13,26,0.98)' }}
        >
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">
                Curated Collections
              </span>
              <h2
                className="font-display font-black text-on-surface mt-2"
                style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
              >
                Browse by Category
              </h2>
            </div>
            <Link
              href="/products"
              className="text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all text-sm"
            >
              View All <Icon name="arrow_forward" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => {
              const meta = CAT_META[cat.name] ?? { icon: 'category', color: '#00c2ff' }
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="flex-shrink-0 glass glass-hover rounded-2xl flex flex-col items-center justify-center gap-3 p-6 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                  style={{ minWidth: 120, minHeight: 120 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
                  >
                    <Icon
                      name={meta.icon}
                      fill
                      className="text-[24px]"
                      style={{ color: meta.color }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-on-surface text-center">
                    {cat.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── FEATURED PRODUCTS ────────────────────────────── */}
        <section className="py-24 px-8 lg:px-24" style={{ background: 'rgba(8,16,36,0.7)' }}>
          <div className="mb-12">
            <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">
              Daily Essentials
            </span>
            <h2
              className="font-display font-black text-on-surface mt-2"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
            >
              Featured Products
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: 280 }} />
              ))
            ) : products.length > 0 ? (
              products.map(p => <ProductCard key={p.id} product={p} />)
            ) : (
              <div className="col-span-4 text-center py-20 glass rounded-2xl">
                <div className="text-5xl mb-4">💊</div>
                <p className="text-on-surface-muted font-medium">
                  Connect the database to see products
                </p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold"
              style={{
                background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
                boxShadow: '0 16px 48px rgba(0,194,255,0.22)',
              }}
            >
              View All Products <Icon name="arrow_forward" />
            </Link>
          </div>
        </section>

        {/* ── TRUST BADGES ─────────────────────────────────── */}
        <section className="py-24 px-8 lg:px-24" style={{ background: 'rgba(5,13,26,0.98)' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {TRUST.map(b => (
              <div
                key={b.title}
                className="glass rounded-2xl p-8 text-center flex flex-col items-center gap-4 glass-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(0,194,255,0.08)',
                    border: '1px solid rgba(0,194,255,0.18)',
                  }}
                >
                  <Icon name={b.icon} fill className="text-[32px] text-primary" />
                </div>
                <h5 className="font-display font-bold text-xl text-on-surface">{b.title}</h5>
                <p className="text-on-surface-muted text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer
        style={{ background: 'rgba(4,10,22,0.99)', borderTop: '1px solid rgba(0,194,255,0.07)' }}
        className="pt-16 pb-8"
      >
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/vms-logo.svg"
                alt="VMS"
                width={110}
                height={36}
                style={{ height: 32, width: 'auto' }}
              />
            </div>
            <p className="text-sm text-on-surface-muted leading-relaxed">
              Curating wellness and providing medical precision since 1999.
            </p>
          </div>

          {[
            {
              title: 'Explore',
              links: [
                { href: '/products', label: 'Shop All' },
                { href: '/orders', label: 'My Orders' },
                { href: '/trust', label: 'Certifications' },
              ],
            },
            {
              title: 'Policy',
              links: [
                { href: '#', label: 'Shipping Policy' },
                { href: '#', label: 'Privacy' },
              ],
            },
            {
              title: 'Contact',
              links: [
                { href: '#', label: 'Vipan Medical Store' },
                { href: '#', label: 'Punjab, India' },
              ],
            },
          ].map(col => (
            <div key={col.title}>
              <h6 className="text-xs font-bold text-primary uppercase tracking-widest mb-5">
                {col.title}
              </h6>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link
                      className="text-on-surface-muted hover:text-primary text-sm transition-colors"
                      href={l.href}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="max-w-7xl mx-auto px-8 mt-12 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-on-surface-muted">
            © 2024 Vipan Medical Store. Curating Wellness Since 1999.
          </p>
        </div>
      </footer>
    </>
  )
}
