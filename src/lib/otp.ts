/**
 * OTP utility — generate, store, send, and verify 6-digit OTPs.
 *
 * Delivery (configure via env vars):
 *   Email → RESEND_API_KEY       (https://resend.com, free tier: 3000/mo)
 *   SMS   → FAST2SMS_API_KEY     (https://fast2sms.com, India SMS)
 *   Dev   → OTP echoed in API response when NODE_ENV !== 'production'
 */

export const OTP_TTL_SEC = 10 * 60 // 10 minutes

/** Cryptographically random 6-digit OTP */
export function generateCode(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1_000_000).padStart(6, '0')
}

/** Returns true if the identifier looks like an Indian mobile number */
export function isPhone(id: string): boolean {
  return /^\+?[6-9]\d{9}$/.test(id.trim())
}

/** Normalise phone to 10-digit local format */
export function normalisePhone(phone: string): string {
  return phone.replace(/^\+91/, '').replace(/\s/g, '').trim()
}

// ── Storage ────────────────────────────────────────────────────────────────────

export async function storeOTP(
  db: D1Database,
  identifier: string,
  code: string,
  type: 'login' | 'register' | 'reset' = 'login',
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  // Invalidate any previous unused OTPs for this identifier + type
  await db
    .prepare('UPDATE otps SET used = 1 WHERE identifier = ? AND type = ? AND used = 0')
    .bind(identifier, type)
    .run()
  await db
    .prepare('INSERT INTO otps (identifier, code, type, expires_at) VALUES (?,?,?,?)')
    .bind(identifier, code, type, now + OTP_TTL_SEC)
    .run()
}

export type VerifyResult = 'ok' | 'invalid' | 'expired' | 'used'

export async function verifyOTP(
  db: D1Database,
  identifier: string,
  code: string,
  type: 'login' | 'register' | 'reset' = 'login',
): Promise<VerifyResult> {
  const now = Math.floor(Date.now() / 1000)
  const row = await db
    .prepare(
      'SELECT id, expires_at, used FROM otps WHERE identifier = ? AND code = ? AND type = ? ORDER BY id DESC LIMIT 1',
    )
    .bind(identifier, code, type)
    .first<{ id: number; expires_at: number; used: number }>()

  if (!row) return 'invalid'
  if (row.used) return 'used'
  if (now > row.expires_at) return 'expired'

  // Mark as consumed
  await db.prepare('UPDATE otps SET used = 1 WHERE id = ?').bind(row.id).run()
  return 'ok'
}

// ── Delivery ───────────────────────────────────────────────────────────────────

async function sendEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log(`[OTP] Email to ${to}: ${code}`)
    return
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VMS Pharmacy <noreply@vipanmedical.com>',
      to: [to],
      subject: `${code} — Your VMS verification code`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#050d1a;color:#e8f4fd;padding:40px;border-radius:16px">
          <h2 style="margin:0 0 8px;font-size:24px">Your OTP</h2>
          <p style="color:#8fafc7;margin:0 0 32px">Use this code to sign in to VMS Pharmacy. It expires in 10 minutes.</p>
          <div style="letter-spacing:16px;font-size:40px;font-weight:800;color:#00c2ff;text-align:center;padding:20px;background:rgba(0,194,255,0.06);border:1px solid rgba(0,194,255,0.2);border-radius:12px">${code}</div>
          <p style="color:#8fafc7;font-size:12px;margin-top:24px">If you didn't request this, ignore this email. Do not share this code.</p>
        </div>
      `,
    }),
  })
}

async function sendSMS(phone: string, code: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY
  if (!apiKey) {
    console.log(`[OTP] SMS to ${phone}: ${code}`)
    return
  }
  const localPhone = normalisePhone(phone)
  await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: 'otp',
      variables_values: code,
      numbers: localPhone,
    }),
  })
}

export async function sendOTP(
  db: D1Database,
  identifier: string,
  type: 'login' | 'register' | 'reset' = 'login',
): Promise<{ code?: string }> {
  const code = generateCode()
  await storeOTP(db, identifier, code, type)

  if (isPhone(identifier)) {
    await sendSMS(identifier, code)
  } else {
    await sendEmail(identifier, code)
  }

  // In non-production, return code so developers can test without a mail/SMS account
  const isDev = process.env.NODE_ENV !== 'production'
  return isDev ? { code } : {}
}
