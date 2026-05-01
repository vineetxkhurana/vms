import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

import { useCart, _resetCartForTests } from '@/hooks/useCart'
import type { Product } from '@/types'

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Test Med',
  description: null,
  price: 10_000, // ₹100 in paise
  price_retailer: null,
  price_wholesaler: null,
  brand: 'other',
  stock: 50,
  category_id: null,
  image_url: null,
  is_active: 1 as 0 | 1,
  variant_group: null,
  variant_label: null,
  variant_type: null,
  ...overrides,
})

describe('useCart', () => {
  beforeEach(() => {
    // Clear localStorage AND reset the module-level singleton
    localStorageMock.clear()
    _resetCartForTests()
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useCart())
    expect(result.current.items).toHaveLength(0)
    expect(result.current.total).toBe(0)
  })

  it('adds a product', () => {
    const { result } = renderHook(() => useCart())
    const product = makeProduct({ id: 10 })

    act(() => {
      result.current.add(product)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(1)
  })

  it('increments quantity when same product added twice', () => {
    const { result } = renderHook(() => useCart())
    const product = makeProduct({ id: 20 })

    act(() => {
      result.current.add(product)
    })
    act(() => {
      result.current.add(product)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('treats different product ids as separate cart items', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.add(makeProduct({ id: 30, variant_label: '100ml' }))
    })
    act(() => {
      result.current.add(makeProduct({ id: 31, variant_label: '500ml' }))
    })

    expect(result.current.items).toHaveLength(2)
  })

  it('removes a product', () => {
    const { result } = renderHook(() => useCart())
    const product = makeProduct({ id: 40 })

    act(() => {
      result.current.add(product)
    })
    act(() => {
      result.current.remove(product.id)
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('updates quantity via update()', () => {
    const { result } = renderHook(() => useCart())
    const product = makeProduct({ id: 50 })

    act(() => {
      result.current.add(product)
    })
    act(() => {
      result.current.update(product.id, 5)
    })

    expect(result.current.items[0].quantity).toBe(5)
  })

  it('removes item when update() called with quantity 0', () => {
    const { result } = renderHook(() => useCart())
    const product = makeProduct({ id: 60 })

    act(() => {
      result.current.add(product)
    })
    act(() => {
      result.current.update(product.id, 0)
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('calculates total in paise correctly', () => {
    const { result } = renderHook(() => useCart())
    const p1 = makeProduct({ id: 70, price: 10_000 }) // ₹100
    const p2 = makeProduct({ id: 71, price: 5_000 }) // ₹50

    act(() => {
      result.current.add(p1)
    })
    act(() => {
      result.current.add(p1)
    }) // qty 2 → ₹200
    act(() => {
      result.current.add(p2)
    }) // qty 1 → ₹50

    expect(result.current.total).toBe(25_000) // ₹250
  })

  it('clears the cart', () => {
    const { result } = renderHook(() => useCart())
    act(() => {
      result.current.add(makeProduct({ id: 80 }))
    })
    act(() => {
      result.current.clear()
    })
    expect(result.current.items).toHaveLength(0)
    expect(result.current.total).toBe(0)
  })
})
