import { describe, it, expect, vi } from 'vitest'
import { verifyPaymentSignature } from '@/lib/razorpay'

// Razorpay payment verification: HMAC-SHA256(orderId|paymentId, secret) must match signature
describe('verifyPaymentSignature', () => {
  const secret    = 'test_webhook_secret_abc123'
  const orderId   = 'order_TEST123'
  const paymentId = 'pay_TEST456'

  async function makeSignature(body: string, key: string): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(key),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(body))
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // verifyPaymentSignature reads RAZORPAY_KEY_SECRET from env — stub it for each test
  const stubEnv = () => vi.stubEnv('RAZORPAY_KEY_SECRET', secret)

  it('returns true for a valid signature', async () => {
    stubEnv()
    const signature = await makeSignature(`${orderId}|${paymentId}`, secret)
    expect(await verifyPaymentSignature(orderId, paymentId, signature)).toBe(true)
  })

  it('returns false for a tampered signature', async () => {
    stubEnv()
    const signature = await makeSignature(`${orderId}|${paymentId}`, secret)
    const tampered  = signature.slice(0, -2) + '00'
    expect(await verifyPaymentSignature(orderId, paymentId, tampered)).toBe(false)
  })

  it('returns false when orderId is different', async () => {
    stubEnv()
    const signature = await makeSignature(`${orderId}|${paymentId}`, secret)
    expect(await verifyPaymentSignature('order_OTHER', paymentId, signature)).toBe(false)
  })

  it('returns false when paymentId is different', async () => {
    stubEnv()
    const signature = await makeSignature(`${orderId}|${paymentId}`, secret)
    expect(await verifyPaymentSignature(orderId, 'pay_OTHER', signature)).toBe(false)
  })

  it('is case-sensitive', async () => {
    stubEnv()
    const signature = await makeSignature(`${orderId}|${paymentId}`, secret)
    expect(await verifyPaymentSignature(orderId.toUpperCase(), paymentId, signature)).toBe(false)
  })
})
