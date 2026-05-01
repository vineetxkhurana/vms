'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { calcTotals } from '@/lib/pricing'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Icon } from '@/components/ui/Icon'

const AddressSchema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().regex(/^\d{10}$/, '10-digit phone required'),
  line1: z.string().min(1, 'Address required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City required'),
  state: z.string().min(1, 'State required'),
  pin: z.string().regex(/^\d{6}$/, '6-digit PIN required'),
})

type SavedAddress = {
  id: number
  label: string
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pin: string
  is_default: 0 | 1
}

declare global {
  interface Window {
    Razorpay: any
  }
}

const STEPS = ['Cart', 'Address', 'Payment', 'Confirmation']

type ResolvedItem = {
  product_id: number
  unit_price: number
  mrp: number
  line_total: number
  was_discounted: boolean
}
type Preview = { items: ResolvedItem[]; subtotal: number; delivery: number; total: number } | null

export default function CheckoutPage() {
  const { items, total: mrpSubtotal, clear } = useCart()
  const fallback = calcTotals(mrpSubtotal)
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pin: '',
  })
  const [loading, setLoading] = useState(false)
  const [step] = useState(1)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [preview, setPreview] = useState<Preview>(null)

  const subtotal = preview?.subtotal ?? fallback.subtotal
  const delivery = preview?.delivery ?? fallback.delivery
  const total = preview?.total ?? fallback.total
  const priceMap = new Map(preview?.items.map(i => [i.product_id, i]) ?? [])

  const token = typeof window !== 'undefined' ? localStorage.getItem('vms_token') : null

  // Fetch resolved pricing
  useEffect(() => {
    if (items.length === 0) return
    fetch('/api/cart/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) setPreview(data as Preview)
      })
      .catch(() => {
        /* use fallback */
      })
  }, [items, token])

  useEffect(() => {
    if (!token) return
    fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : { addresses: [] }))
      .then((d: any) => {
        const addrs: SavedAddress[] = d.addresses ?? []
        setSavedAddresses(addrs)
        const def = addrs.find(a => a.is_default) ?? addrs[0]
        if (def)
          setForm({
            name: def.name,
            phone: def.phone,
            line1: def.line1,
            line2: def.line2 ?? '',
            city: def.city,
            state: def.state,
            pin: def.pin,
          })
      })
      .catch(() => {})
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Please login first')
      router.push('/login')
      return
    }

    const parsed = AddressSchema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
          address: parsed.data,
        }),
      })
      const orderData = (await orderRes.json()) as {
        error?: string
        amount?: number
        razorpay_order_id?: string
        order_id?: number
      }
      if (!orderRes.ok) throw new Error(orderData.error)

      await new Promise<void>((resolve, reject) => {
        if (window.Razorpay) {
          resolve()
          return
        }
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve()
        s.onerror = () =>
          reject(new Error('Failed to load payment gateway. Check your connection and try again.'))
        document.body.appendChild(s)
      })

      // ─── Dev mode: no Razorpay keys → mark order paid locally and continue ───
      if (!orderData.razorpay_order_id) {
        clear()
        router.push(`/orders?success=1&order=${orderData.order_id}`)
        toast.success('Order placed! (dev mode — payment skipped)')
        return
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: 'INR',
          order_id: orderData.razorpay_order_id,
          name: 'Vipan Medical Store',
          description: 'Medicine Order',
          prefill: { contact: form.phone },
          theme: { color: '#00666e' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
              if (verifyRes.ok) {
                clear()
                router.push(`/orders?success=1&order=${orderData.order_id}`)
                resolve()
              } else {
                reject(
                  new Error(
                    'Payment verification failed. Your payment may still be processing — check your orders in a few minutes or contact support.',
                  ),
                )
              }
            } catch {
              reject(
                new Error(
                  'Network error during payment verification. Please check your orders page.',
                ),
              )
            }
          },
          modal: {
            ondismiss: () =>
              reject(
                new Error(
                  'Payment cancelled. Your order is saved — you can retry from your orders page.',
                ),
              ),
          },
        })
        rzp.open()
      })
    } catch (e: any) {
      toast.error(e.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-on-surface mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input-glass"
      />
    </div>
  )

  return (
    <div
      className="min-h-screen px-6 lg:px-20"
      style={{ paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}
    >
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background:
                    i === step
                      ? 'linear-gradient(135deg, #00c2ff, #7c3aed)'
                      : i < step
                        ? 'rgba(0,229,160,0.15)'
                        : 'rgba(10,20,45,0.6)',
                  color: i <= step ? '#e8f4fd' : '#8fafc7',
                  border: i === step ? 'none' : '1px solid rgba(0,194,255,0.15)',
                }}
              >
                {i < step && (
                  <Icon name="check_circle" fill className="text-[16px] text-secondary" />
                )}
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-8 h-0.5"
                  style={{ background: i < step ? 'rgba(0,229,160,0.5)' : 'rgba(0,194,255,0.12)' }}
                />
              )}
            </div>
          ))}
        </div>

        <h1
          className="font-display font-black text-on-surface mb-8"
          style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
        >
          Delivery Details
        </h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-8">
          {/* Left: address + payment */}
          <div className="md:col-span-3 flex flex-col gap-6">
            {/* Address block */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-bold text-on-surface text-lg mb-5 flex items-center gap-2">
                <Icon name="location_on" fill className="text-primary" />
                Delivery Address
              </h2>
              <div className="flex flex-col gap-4">
                {savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider mb-2">
                      Saved Addresses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            setForm({
                              name: a.name,
                              phone: a.phone,
                              line1: a.line1,
                              line2: a.line2 ?? '',
                              city: a.city,
                              state: a.state,
                              pin: a.pin,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: 'rgba(0,194,255,0.08)',
                            border: '1px solid rgba(0,194,255,0.2)',
                            color: '#8fafc7',
                          }}
                        >
                          <span className="text-on-surface">{a.label}</span> · {a.city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {field('name', 'Full Name', 'Vipan Kumar')}
                {field('phone', 'Phone Number', '9876543210', 'tel')}
                {field('line1', 'Address Line 1', 'House / Flat No, Street')}
                {field('line2', 'Address Line 2 (optional)', 'Landmark etc.')}
                <div className="grid grid-cols-2 gap-3">
                  {field('city', 'City', 'Amritsar')}
                  {field('state', 'State', 'Punjab')}
                </div>
                {field('pin', 'PIN Code', '143001')}
              </div>
            </div>

            {/* Payment block */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-bold text-on-surface text-lg mb-4 flex items-center gap-2">
                <Icon name="payment" fill className="text-primary" />
                Payment
              </h2>
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(0,194,255,0.05)',
                  border: '1px solid rgba(0,194,255,0.15)',
                }}
              >
                <Icon name="credit_card" fill className="text-primary text-[28px]" />
                <div>
                  <p className="font-semibold text-on-surface text-sm">Razorpay Secure Payment</p>
                  <p className="text-xs text-on-surface-muted">Cards, UPI, Net Banking, Wallets</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="md:col-span-2">
            <div className="glass rounded-2xl p-6 sticky top-24">
              <h2 className="font-display font-bold text-on-surface text-lg mb-5">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map(({ product, quantity }) => {
                  const resolved = priceMap.get(product.id)
                  const _unitPrice = resolved?.unit_price ?? product.price
                  const lineTotal = resolved?.line_total ?? product.price * quantity
                  const wasDiscounted = resolved?.was_discounted ?? false
                  return (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-on-surface-muted line-clamp-1 flex-1 mr-4">
                        {product.name} × {quantity}
                      </span>
                      <div className="text-right">
                        <span className="text-on-surface font-medium">
                          ₹{(lineTotal / 100).toFixed(2)}
                        </span>
                        {wasDiscounted && (
                          <span
                            className="text-xs ml-2"
                            style={{ color: '#5a7fa0', textDecoration: 'line-through' }}
                          >
                            ₹{((product.price * quantity) / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div
                className="pt-4 space-y-2 mb-6"
                style={{ borderTop: '1px solid rgba(0,194,255,0.12)' }}
              >
                <div className="flex justify-between text-sm text-on-surface-muted">
                  <div>
                    <p>Delivery</p>
                    <p className="text-xs" style={{ color: '#5a7fa0' }}>
                      Local delivery · 24–48 hrs
                    </p>
                  </div>
                  <span className="text-on-surface font-semibold">
                    {delivery === 0 ? (
                      <span className="text-secondary">Free</span>
                    ) : (
                      `₹${(delivery / 100).toFixed(2)}`
                    )}
                  </span>
                </div>
                {(() => {
                  const savings = mrpSubtotal - subtotal
                  return savings > 0 ? (
                    <div className="flex justify-between text-sm" style={{ color: '#34d399' }}>
                      <span>Bulk savings</span>
                      <span className="font-semibold">−₹{(savings / 100).toFixed(2)}</span>
                    </div>
                  ) : null
                })()}
                <div className="flex justify-between font-black text-on-surface text-xl pt-1">
                  <span>Total</span>
                  <span className="text-primary">₹{(total / 100).toFixed(2)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="cta-btn w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
                  boxShadow: '0 16px 48px rgba(0,194,255,0.28)',
                  border: 'none',
                }}
              >
                {loading ? (
                  <>
                    <Icon name="autorenew" className="animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Icon name="lock" className="text-[18px]" /> Pay ₹{(total / 100).toFixed(2)}
                  </>
                )}
              </button>
              <p className="text-xs text-on-surface-muted text-center mt-3 flex items-center justify-center gap-1">
                <Icon name="shield" fill className="text-[14px] text-secondary" />
                Secured by Razorpay
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
