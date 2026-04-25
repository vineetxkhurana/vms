import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AddToCartButton from '@/components/shop/AddToCartButton'
import { Icon } from '@/components/ui/Icon'
import { getServerDB } from '@/lib/server-db'
import { resolvePrice } from '@/lib/auth'
import type { ProductVariant } from '@/types'

async function getProduct(id: string) {
  const db = await getServerDB()
  if (!db) return null

  const product = await db
    .prepare(`SELECT p.*, c.name as category_name
              FROM products p LEFT JOIN categories c ON p.category_id=c.id
              WHERE p.id=? AND p.is_active=1`)
    .bind(Number(id))
    .first() as any
  if (!product) return null

  const resolvedPrice = resolvePrice(product.price, product.price_retailer, product.price_wholesaler, null)

  let variants: any[] = []
  if (product.variant_group) {
    const { results } = await db
      .prepare(`SELECT id, name, variant_label as label, price, price_retailer, price_wholesaler, stock, image_url
                FROM products WHERE variant_group=? AND is_active=1 AND id!=? ORDER BY id ASC`)
      .bind(product.variant_group, product.id)
      .all() as { results: any[] }
    variants = results.map((v: any) => ({
      ...v,
      price: resolvePrice(v.price, v.price_retailer, v.price_wholesaler, null),
    }))
  }

  return { ...product, price: resolvedPrice, variants }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const priceRs = (product.price / 100).toFixed(2)
  const allVariants: ProductVariant[] = product.variants ?? []
  const isSizeVariant   = product.variant_type === 'size'
  const isFlavorVariant = product.variant_type === 'flavor'

  // All options including self (for size selector)
  const sizeOptions = isSizeVariant
    ? [
        { id: product.id, label: product.variant_label ?? '', price: product.price },
        ...allVariants.map((v: ProductVariant) => ({ id: v.id, label: v.label, price: v.price })),
      ]
    : []

  return (
    <div className="min-h-screen px-6 lg:px-20" style={{ paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* ── Image card ───────────────────────────────── */}
          <div className="glass rounded-2xl p-10 flex items-center justify-center sticky top-24" style={{ minHeight: 360 }}>
            {product.image_url ? (
              <div className="relative w-full h-80">
                <Image src={product.image_url} alt={product.name} fill className="object-contain" />
              </div>
            ) : (
              <Icon name="medication" fill className="text-[160px] text-on-surface-muted opacity-30" />
            )}
          </div>

          {/* ── Details ──────────────────────────────────── */}
          <div className="space-y-6">
            {product.brand === 'VMS' && (
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-secondary"
                style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)' }}>
                VMS Generic
              </span>
            )}

            <div>
              <h1 className="font-display font-black text-on-surface" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
                {product.name}
              </h1>
              <p className="text-on-surface-muted mt-1">{product.category_name}</p>
            </div>

            {/* ── Size selector (size variants) ─────────── */}
            {isSizeVariant && sizeOptions.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-on-surface-muted mb-3">Choose size</p>
                <div className="flex flex-wrap gap-3">
                  {sizeOptions.map(opt => {
                    const isActive = opt.id === product.id
                    return (
                      <Link key={opt.id} href={`/products/${opt.id}`}
                        className="px-5 py-2 rounded-full text-sm font-bold transition-all"
                        style={{
                          background: isActive ? 'rgba(0,194,255,0.2)' : 'rgba(0,194,255,0.05)',
                          border: isActive ? '1.5px solid rgba(0,194,255,0.7)' : '1px solid rgba(0,194,255,0.2)',
                          color: isActive ? '#00c2ff' : '#8fafc7',
                          textDecoration: 'none',
                        }}>
                        {opt.label}
                        <span className="ml-2 font-normal opacity-70">₹{(opt.price / 100).toFixed(0)}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="text-on-surface-muted leading-relaxed">
              {product.description ?? 'No description available.'}
            </p>

            <div className="flex items-end gap-3">
              <span className="font-display font-black text-primary" style={{ fontSize: 48 }}>₹{priceRs}</span>
              <span className="text-sm text-on-surface-muted mb-2">incl. all taxes</span>
            </div>

            {product.stock > 0 && product.stock < 10 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                <Icon name="warning" className="text-[18px]" />
                Only {product.stock} left in stock
              </div>
            )}
            {product.stock === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                <Icon name="block" className="text-[18px]" />
                Out of stock
              </div>
            )}

            <div className="pt-2">
              <AddToCartButton product={product} disabled={product.stock === 0} fullWidth />
            </div>

            {/* Accordion sections */}
            <div className="space-y-3 pt-6" style={{ borderTop: '1px solid rgba(0,194,255,0.12)' }}>
              {product.composition && (
                <details className="group glass rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-on-surface list-none">
                    Composition
                    <Icon name="expand_more" className="group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="px-5 pb-4 text-sm text-on-surface-muted">{product.composition}</p>
                </details>
              )}
              {product.usage && (
                <details className="group glass rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-on-surface list-none">
                    Usage &amp; Dosage
                    <Icon name="expand_more" className="group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="px-5 pb-4 text-sm text-on-surface-muted">{product.usage}</p>
                </details>
              )}
              <details className="group glass rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-on-surface list-none">
                  Safety Information
                  <Icon name="expand_more" className="group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-5 pb-4 text-sm text-on-surface-muted">
                  Keep out of reach of children. Store in a cool, dry place. Consult your pharmacist before use.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* ── Flavor recommendations ──────────────────────── */}
        {isFlavorVariant && allVariants.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-0.5" style={{ background: 'linear-gradient(90deg, #00c2ff, transparent)' }} />
              <h2 className="font-display font-bold text-on-surface text-xl">Also available in</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allVariants.map((v: ProductVariant) => (
                <Link key={v.id} href={`/products/${v.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/40 transition-all cursor-pointer"
                    style={{ border: '1px solid rgba(0,194,255,0.1)' }}>
                    <div className="relative w-full h-24 rounded-xl overflow-hidden"
                      style={{ background: 'rgba(0,194,255,0.04)', border: '1px solid rgba(0,194,255,0.08)' }}>
                      {v.image_url
                        ? <Image src={v.image_url} alt={v.name} fill style={{ objectFit: 'contain', padding: 8 }} />
                        : <span className="flex h-full items-center justify-center text-3xl">💊</span>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary mb-0.5">{v.label}</p>
                      <p className="text-xs text-on-surface-muted line-clamp-2 leading-tight">{v.name}</p>
                    </div>
                    <span className="font-display font-bold text-on-surface text-base">₹{(v.price / 100).toFixed(0)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


