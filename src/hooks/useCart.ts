'use client'
import { useState, useEffect } from 'react'
import type { CartItem, Product } from '@/types'

const KEY = 'vms_cart'

// ── Persisted shape (lean — no prices stored) ─────────────────────────────────
type PersistedItem = { product_id: number; quantity: number }

// ── Module-level singleton store ──────────────────────────────────────────────
// All useCart() instances share this state so adding from any ProductCard
// correctly accumulates rather than overwrites.
let _items: CartItem[] = []
let _hydrated = false
const _listeners = new Set<() => void>()

function _notify() {
  _listeners.forEach(fn => fn())
}

function _persist() {
  if (typeof window === 'undefined') return
  const lean: PersistedItem[] = _items.map(i => ({
    product_id: i.product.id,
    quantity: i.quantity,
  }))
  localStorage.setItem(KEY, JSON.stringify(lean))
}

// ── Actions (operate on module-level _items) ──────────────────────────────────
function addItem(product: Product, quantity = 1) {
  const existing = _items.find(i => i.product.id === product.id)
  if (existing) {
    _items = _items.map(i =>
      i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
    )
  } else {
    _items = [..._items, { product, quantity }]
  }
  _persist()
  _notify()
}

function removeItem(productId: number) {
  _items = _items.filter(i => i.product.id !== productId)
  _persist()
  _notify()
}

function updateItem(productId: number, quantity: number) {
  if (quantity <= 0) return removeItem(productId)
  _items = _items.map(i => (i.product.id === productId ? { ...i, quantity } : i))
  _persist()
  _notify()
}

function clearCart() {
  _items = []
  _persist()
  _notify()
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useCart() {
  const [, rerender] = useState(0)

  useEffect(() => {
    const handler = () => rerender(n => n + 1)
    _listeners.add(handler)

    // Hydrate once per session from localStorage, then fetch fresh prices.
    // Storing only product_id+qty ensures tier prices are always re-resolved
    // from the server (prevents wholesaler paying retail price after refresh).
    if (!_hydrated) {
      _hydrated = true
      try {
        const raw: PersistedItem[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
        if (raw.length > 0) {
          const ids = raw.map(r => r.product_id).join(',')
          fetch(`/api/products?ids=${ids}`)
            .then(r => (r.ok ? r.json() : { products: [] }))
            .then((data: unknown) => {
              const products = (data as { products?: Product[] }).products ?? []
              const productMap = new Map(products.map(p => [p.id, p]))
              // Only keep items whose product still exists and is active
              _items = raw
                .filter(r => productMap.has(r.product_id))
                .map(r => ({ product: productMap.get(r.product_id)!, quantity: r.quantity }))
              _notify()
            })
            .catch(() => {
              /* network error — keep items empty */
            })
        }
      } catch {
        /* corrupt storage — start fresh */
      }
    }

    handler()
    return () => {
      _listeners.delete(handler)
    }
  }, [])

  const total = _items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const count = _items.reduce((s, i) => s + i.quantity, 0)

  return {
    items: _items,
    add: addItem,
    remove: removeItem,
    update: updateItem,
    clear: clearCart,
    total,
    count,
  }
}

// ── Exposed for testing only ──────────────────────────────────────────────────
export function _resetCartForTests() {
  _items = []
  _hydrated = false
  _listeners.clear()
}
