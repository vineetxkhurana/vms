'use client'
import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/shop/ProductCard'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import type { Product } from '@/types'

type Category = { id: number; name: string }

const PAGE_SIZE = 20

// Category icon mapping
const CAT_ICONS: Record<string, string> = {
  Medicines: 'medication',
  'Vitamins & Supplements': 'nutrition',
  'Skin Care': 'spa',
  'Baby Care': 'child_care',
  'First Aid': 'medical_services',
  'Medical Devices': 'monitor_heart',
  Ayurvedic: 'eco',
  'Knee Support': 'accessibility_new',
  'Back & Abdominal Support': 'airline_seat_recline_normal',
  'Elbow & Arm Support': 'sports_martial_arts',
  'Wrist & Hand Support': 'front_hand',
  'Ankle & Foot Support': 'do_not_step',
  'Cervical & Neck Support': 'person',
  'Shoulder Support': 'sports_handball',
  'Hot & Cold Therapy': 'thermostat',
  'Bandages & Compression': 'healing',
  'Body Massagers': 'self_improvement',
  'Weighing Scales': 'scale',
  'Memory Foam': 'king_bed',
  'Mobility Aids': 'accessible',
  'Surgical Instruments': 'biotech',
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? '')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((d: any) => setCategories((d.categories ?? []) as Category[]))
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async (s: string, catId: string, pg: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE) })
    if (s) params.set('search', s)
    if (catId) params.set('category', catId)
    try {
      const res = await fetch(`/api/products?${params}`)
      const data = (await res.json()) as { products: Product[]; total?: number }
      setProducts(data.products ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setProducts([])
      setTotal(0)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts(search, categoryId, page)
  }, [search, categoryId, page, fetchProducts])

  // Reset to page 1 when search or category changes
  const handleFilterChange = (newSearch: string, newCat: string) => {
    setPage(1)
    setSearch(newSearch)
    setCategoryId(newCat)
  }

  const handleSearchChange = (val: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => handleFilterChange(val, categoryId), 300)
  }

  // Generate page numbers: show 1, ..., current-1, current, current+1, ..., last
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | 'ellipsis')[] = []
    pages.push(1)
    if (page > 3) pages.push('ellipsis')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('ellipsis')
    if (totalPages > 1) pages.push(totalPages)
    return pages
  }

  const pageButtonStyle = (active: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    cursor: active ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: active ? 'linear-gradient(135deg, #00c2ff, #7c3aed)' : 'rgba(10,20,45,0.7)',
    color: active ? '#fff' : '#8fafc7',
    outline: active ? 'none' : '1px solid rgba(0,194,255,0.15)',
    transition: 'all 0.2s',
  })

  return (
    <div
      style={{ minHeight: '100vh', paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 max(32px, 4vw)',
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: 40 }}>
          <PageHeader label="Catalogue" title="All Products" />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 480, marginBottom: 32 }}>
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8fafc7',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="search" className="text-[20px]" />
          </span>
          <input
            defaultValue={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search products, brands..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: 100,
              background: 'rgba(10,20,45,0.8)',
              border: '1px solid rgba(0,194,255,0.2)',
              color: '#e8f4fd',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
            }}
          />
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          <button
            onClick={() => handleFilterChange(search, '')}
            style={{
              padding: '7px 18px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              background:
                categoryId === ''
                  ? 'linear-gradient(135deg, #00c2ff, #7c3aed)'
                  : 'rgba(10,20,45,0.7)',
              color: categoryId === '' ? '#fff' : '#8fafc7',
              outline: categoryId === '' ? 'none' : '1px solid rgba(0,194,255,0.2)',
            }}
          >
            All
          </button>
          {categories.map(cat => {
            const active = categoryId === String(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => handleFilterChange(search, active ? '' : String(cat.id))}
                style={{
                  padding: '7px 18px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  background: active
                    ? 'linear-gradient(135deg, #00c2ff, #7c3aed)'
                    : 'rgba(10,20,45,0.7)',
                  color: active ? '#fff' : '#8fafc7',
                  outline: active ? 'none' : '1px solid rgba(0,194,255,0.2)',
                }}
              >
                <Icon name={CAT_ICONS[cat.name] ?? 'category'} className="text-[14px]" />
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Product count & page info */}
        {!loading && (
          <p
            style={{
              fontSize: 13,
              color: '#8fafc7',
              marginBottom: 16,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {total > 0
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} products`
              : 'No products found'}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <SkeletonGrid count={8} height={280} />
        ) : products.length > 0 ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 20,
              }}
            >
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 48,
                }}
              >
                {/* Prev */}
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    ...pageButtonStyle(false),
                    opacity: page === 1 ? 0.3 : 1,
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Previous page"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((p, i) =>
                  p === 'ellipsis' ? (
                    <span
                      key={`e${i}`}
                      style={{ color: '#8fafc7', fontSize: 14, padding: '0 4px' }}
                    >
                      …
                    </span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)} style={pageButtonStyle(p === page)}>
                      {p}
                    </button>
                  ),
                )}

                {/* Next */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    ...pageButtonStyle(false),
                    opacity: page === totalPages ? 0.3 : 1,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  }}
                  aria-label="Next page"
                >
                  <Icon name="chevron_right" className="text-[18px]" />
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            emoji="🔍"
            title="No products found"
            description="Try a different search term or category."
          />
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  )
}
