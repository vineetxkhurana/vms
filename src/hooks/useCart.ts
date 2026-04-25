'use client'
import { useState, useEffect } from 'react'
import type { CartItem, Product } from '@/types'

const KEY = 'vms_cart'

// ── Module-level singleton store ──────────────────────────────────────────────
// All useCart() instances share this state, so adding from any ProductCard
// correctly accumulates rather than overwrites.
let _items: CartItem[] = []
const _listeners = new Set<() => void>()

function _notify() { _listeners.forEach(fn => fn()) }

function _persist() {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(_items))
}

function _load() {
  if (typeof window === 'undefined') return
  try { _items = JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { _items = [] }
}

// ── Actions (operate on module-level _items) ──────────────────────────────────
function addItem(product: Product, quantity = 1) {
  const existing = _items.find(i => i.product.id === product.id)
  if (existing) {
    _items = _items.map(i =>
      i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
    )
  } else {
    _items = [..._items, { product, quantity }]
  }
  _persist(); _notify()
}

function removeItem(productId: number) {
  _items = _items.filter(i => i.product.id !== productId)
  _persist(); _notify()
}

function updateItem(productId: number, quantity: number) {
  if (quantity <= 0) return removeItem(productId)
  _items = _items.map(i => i.product.id === productId ? { ...i, quantity } : i)
  _persist(); _notify()
}

function clearCart() { _items = []; _persist(); _notify() }

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useCart() {
  const [, rerender] = useState(0)

  useEffect(() => {
    // Load from localStorage on first mount (only runs once per page load)
    if (_items.length === 0) _load()
    // Subscribe to store changes so re-renders propagate to all instances
    const handler = () => rerender(n => n + 1)
    _listeners.add(handler)
    handler() // trigger initial render with loaded items
    return () => { _listeners.delete(handler) }
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
