'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/shop/ProductCard'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import type { Product } from '@/types'

type Category = { id: number; name: string }

// Category icon mapping
const CAT_ICONS: Record<string, string> = {
  'Medicines': 'medication',
  'Vitamins & Supplements': 'nutrition',
  'Skin Care': 'spa',
  'Baby Care': 'child_care',
  'First Aid': 'medical_services',
  'Medical Devices': 'monitor_heart',
  'Ayurvedic': 'eco',
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  // category is stored as a numeric ID string (or '' for all)
  const [categoryId, setCategoryId] = useState(searchParams.get('category') ?? '')

  // Fetch categories once on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((d: any) => setCategories((d.categories ?? []) as Category[]))
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async (s: string, catId: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1' })
    if (s) params.set('search', s)
    if (catId) params.set('category', catId)   // passes numeric ID ✓
    try {
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json() as { products: Product[] }
      setProducts(data.products ?? [])
    } catch {
      setProducts([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts(search, categoryId) }, [search, categoryId, fetchProducts])

  return (
    <div style={{ minHeight: '100vh', paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}>
      <div style={{ position: 'relative', zIndex: 1, padding: '0 max(32px, 4vw)', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <PageHeader label="Catalogue" title="All Products" />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 480, marginBottom: 32 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#8fafc7', display: 'flex', alignItems: 'center' }}>
            <Icon name="search" className="text-[20px]" />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines, vitamins..."
            style={{
              width: '100%', padding: '14px 16px 14px 48px', borderRadius: 100,
              background: 'rgba(10,20,45,0.8)', border: '1px solid rgba(0,194,255,0.2)',
              color: '#e8f4fd', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none',
            }}
          />
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          {/* All */}
          <button
            onClick={() => setCategoryId('')}
            style={{
              padding: '7px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6, border: 'none',
              background: categoryId === '' ? 'linear-gradient(135deg, #00c2ff, #7c3aed)' : 'rgba(10,20,45,0.7)',
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
                onClick={() => setCategoryId(active ? '' : String(cat.id))}
                style={{
                  padding: '7px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6, border: 'none',
                  background: active ? 'linear-gradient(135deg, #00c2ff, #7c3aed)' : 'rgba(10,20,45,0.7)',
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

        {/* Grid */}
        {loading ? (
          <SkeletonGrid count={8} height={280} />
        ) : products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
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
  return <Suspense><ProductsContent /></Suspense>
}
