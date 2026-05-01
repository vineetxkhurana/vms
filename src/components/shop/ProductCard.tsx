'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product, ProductVariant } from '@/types'
import AddToCartButton from './AddToCartButton'

type Props = { product: Product & { category_name?: string } }

export default function ProductCard({ product }: Props) {
  const hasVariants = (product.variants?.length ?? 0) > 0

  // Build the full list of selectable options (primary + siblings)
  const options: {
    id: number
    name: string
    label: string
    price: number
    stock: number
    image_url: string | null
  }[] = hasVariants
    ? [
        {
          id: product.id,
          name: product.name,
          label: product.variant_label ?? '',
          price: product.price,
          stock: product.stock,
          image_url: product.image_url,
        },
        ...(product.variants ?? []).map((v: ProductVariant) => ({
          id: v.id,
          name: v.name,
          label: v.label,
          price: v.price,
          stock: v.stock,
          image_url: v.image_url,
        })),
      ]
    : []

  const [activeOption, setActiveOption] = useState(options[0] ?? null)

  // The product to add to cart / show price for
  const activeId = activeOption?.id ?? product.id
  const activePrice = activeOption?.price ?? product.price
  const activeStock = activeOption?.stock ?? product.stock
  const activeImg = activeOption?.image_url ?? product.image_url
  const priceRs = (activePrice / 100).toFixed(2)

  // Build a variant-aware product object for AddToCartButton
  const cartProduct: Product = hasVariants
    ? {
        ...product,
        id: activeId,
        name: activeOption?.name ?? product.name,
        price: activePrice,
        stock: activeStock,
        image_url: activeImg,
        variant_label: activeOption?.label ?? null,
      }
    : product

  // Base product name without size suffix for clean display
  const displayName = product.name

  const isSizePills = product.variant_type === 'size'
  const isFlavorBadge = product.variant_type === 'flavor'

  return (
    <div
      className="card-3d"
      style={{
        background: 'rgba(10,20,45,0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,194,255,0.1)',
        borderRadius: 16,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow accent */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(0,194,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Variant count badge (top-left corner) */}
      {hasVariants && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            background: 'rgba(124,58,237,0.18)',
            border: '1px solid rgba(124,58,237,0.35)',
            color: '#a78bfa',
            borderRadius: 100,
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none',
          }}
        >
          {options.length} {product.variant_type === 'size' ? 'sizes' : 'variants'}
        </div>
      )}

      <Link href={`/products/${activeId}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            aspectRatio: '4/3',
            background: '#f0f4f8',
            borderRadius: 12,
            marginBottom: 12,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {activeImg ? (
            <Image
              src={activeImg}
              alt={displayName}
              fill
              style={{ objectFit: 'contain', padding: '10px' }}
              onError={e => {
                ;(e.target as HTMLImageElement).style.display = 'none'
                ;(e.target as HTMLImageElement)
                  .parentElement!.querySelector('.img-fallback')
                  ?.removeAttribute('hidden')
              }}
            />
          ) : null}
          <span
            className="img-fallback"
            hidden={!!activeImg}
            style={{ fontSize: 40, opacity: 0.4 }}
          >
            💊
          </span>
          {product.brand === 'VMS' && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,194,255,0.15)',
                border: '1px solid rgba(0,194,255,0.3)',
                color: '#00c2ff',
                borderRadius: 100,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              VMS Generic
            </div>
          )}
          {activeStock === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(240,244,248,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#64748b',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      <Link href={`/products/${activeId}`} style={{ textDecoration: 'none' }}>
        <h4
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            color: '#e8f4fd',
            marginBottom: 4,
            lineHeight: 1.35,
          }}
        >
          {displayName}
        </h4>
      </Link>
      <p
        style={{
          fontSize: 11,
          color: '#8fafc7',
          marginBottom: 10,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {product.category_name ?? 'General'}
      </p>

      {/* Size pills (shown inline on card for 'size' type) */}
      {isSizePills && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveOption(opt)}
              style={{
                padding: '3px 10px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background:
                  activeOption?.id === opt.id ? 'rgba(0,194,255,0.2)' : 'rgba(0,194,255,0.05)',
                border:
                  activeOption?.id === opt.id
                    ? '1px solid rgba(0,194,255,0.6)'
                    : '1px solid rgba(0,194,255,0.15)',
                color: activeOption?.id === opt.id ? '#00c2ff' : '#8fafc7',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Flavor pills */}
      {isFlavorBadge && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveOption(opt)}
              title={opt.label}
              style={{
                padding: '3px 9px',
                borderRadius: 100,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background:
                  activeOption?.id === opt.id ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.07)',
                border:
                  activeOption?.id === opt.id
                    ? '1px solid rgba(124,58,237,0.6)'
                    : '1px solid rgba(124,58,237,0.2)',
                color: activeOption?.id === opt.id ? '#c4b5fd' : '#8fafc7',
                maxWidth: 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: 20,
            color: '#00c2ff',
          }}
        >
          ₹{priceRs}
        </span>
        <AddToCartButton product={cartProduct} disabled={activeStock === 0} />
      </div>
    </div>
  )
}
