'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types'
import { Icon } from '@/components/ui/Icon'

export default function AddToCartButton({ product, disabled, fullWidth }: { product: Product; disabled?: boolean; fullWidth?: boolean }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    add(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    toast.success(`${product.name.split(' ').slice(0, 3).join(' ')} added to cart`, {
      icon: '🛒',
      duration: 2000,
    })
  }

  if (fullWidth) {
    return (
      <button
        onClick={handleAdd}
        disabled={disabled || added}
        className="cta-btn w-full flex items-center justify-center gap-3 py-4 rounded-full font-bold text-lg text-white"
        style={{
          background: added
            ? 'linear-gradient(135deg, #00e5a0, #00c2ff)'
            : 'linear-gradient(135deg, #00c2ff, #7c3aed)',
          boxShadow: added
            ? '0 16px 48px rgba(0,229,160,0.3)'
            : '0 16px 48px rgba(0,194,255,0.3)',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: 'none',
          transition: 'all 0.25s ease',
        }}
      >
        <Icon name={added ? 'check_circle' : 'add_shopping_cart'} fill className="text-[22px]" />
        {added ? 'Added to Cart!' : 'Add to Cart'}
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={disabled || added}
      style={{
        width: 40, height: 40, borderRadius: '50%',
        background: added ? 'linear-gradient(135deg, #00e5a0, #00c2ff)' : 'linear-gradient(135deg, #00c2ff, #7c3aed)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        boxShadow: added ? '0 4px 20px rgba(0,229,160,0.4)' : '0 4px 20px rgba(0,194,255,0.3)',
        flexShrink: 0,
      }}
    >
      <Icon name={added ? 'check' : 'add'} className="text-[18px]" />
    </button>
  )
}
