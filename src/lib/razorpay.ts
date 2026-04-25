export function createRazorpayOrder(amountPaise: number, receiptId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID!
  const keySecret = process.env.RAZORPAY_KEY_SECRET!
  const credentials = btoa(`${keyId}:${keySecret}`)

  return fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
    }),
  }).then(r => r.json())
}

export async function verifyPaymentSignature(
  orderId: string, paymentId: string, signature: string
): Promise<boolean> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET!
  const body = `${orderId}|${paymentId}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(keySecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
  return hex === signature
}
