'use client'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types'
import { Icon } from '@/components/ui/Icon'

export default function AddToCartButton({ product, disabled, fullWidth }: { product: Product; disabled?: boolean; fullWidth?: boolean }) {
  const { items, add, update, remove } = useCart()
  const cartItem = items.find(i => i.product.id === product.id)
  const qty = cartItem?.quantity ?? 0

  const handleAdd = () => {
    add(product)
    toast.success(`${product.name.split(' ').slice(0, 3).join(' ')} added`, {
      icon: '🛒',
      duration: 1500,
    })
  }

  const handleIncrement = () => update(product.id, qty + 1)
  const handleDecrement = () => {
    if (qty <= 1) remove(product.id)
    else update(product.id, qty - 1)
  }

  // ── Stepper (item already in cart) ──
  if (qty > 0) {
    const stepperStyle = {
      display: 'flex', alignItems: 'center', gap: fullWidth ? 16 : 4,
      ...(fullWidth ? {
        width: '100%', justifyContent: 'center', padding: '10px 0', borderRadius: 100,
        background: 'rgba(0,194,255,0.06)', border: '1px solid rgba(0,194,255,0.2)',
      } : {}),
    }
    const btnSize = fullWidth ? 38 : 32
    const btnStyle = (bg: string) => ({
      width: btnSize, height: btnSize, borderRadius: '50%',
      background: bg, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', transition: 'all 0.15s ease', flexShrink: 0 as const,
    })
    return (
      <div style={stepperStyle}>
        <button onClick={handleDecrement} style={btnStyle(qty === 1 ? 'rgba(239,68,68,0.7)' : 'rgba(0,194,255,0.25)')}>
          <Icon name={qty === 1 ? 'delete' : 'remove'} className={fullWidth ? 'text-[18px]' : 'text-[16px]'} />
        </button>
        <span style={{
          minWidth: fullWidth ? 40 : 28, textAlign: 'center',
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: fullWidth ? 18 : 15, color: '#e8f4fd',
        }}>{qty}</span>
        <button onClick={handleIncrement} style={btnStyle('rgba(0,194,255,0.25)')}>
          <Icon name="add" className={fullWidth ? 'text-[18px]' : 'text-[16px]'} />
        </button>
      </div>
    )
  }

  // ── Initial add button ──
  if (fullWidth) {
    return (
      <button
        onClick={handleAdd}
        disabled={disabled}
        className="cta-btn w-full flex items-center justify-center gap-3 py-4 rounded-full font-bold text-lg text-white"
        style={{
          background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
          boxShadow: '0 16px 48px rgba(0,194,255,0.3)',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: 'none', transition: 'all 0.25s ease',
        }}
      >
        <Icon name="add_shopping_cart" fill className="text-[22px]" />
        Add to Cart
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={disabled}
      style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        boxShadow: '0 4px 20px rgba(0,194,255,0.3)',
        flexShrink: 0,
      }}
    >
      <Icon name="add" className="text-[18px]" />
    </button>
  )
}
