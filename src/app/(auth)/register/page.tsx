'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Icon } from '@/components/ui/Icon'

type Step = 'details' | 'otp' | 'done'

const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: 'Google sign-in was cancelled.',
  oauth_misconfigured: 'Google sign-in is not configured yet.',
  google_token_failed: 'Failed to authenticate with Google. Please try again.',
  google_profile_failed: 'Could not retrieve your Google profile.',
  google_email_unverified: 'Your Google account email is not verified.',
  db_unavailable: 'Service temporarily unavailable.',
  user_creation_failed: 'Could not create your account. Please try again.',
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.233 17.64 11.925 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  )
}

function RegisterPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)

  const isPhone = /^[6-9]\d{9}$/.test(identifier.trim())

  // Handle Google OAuth redirect errors and token sync
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) toast.error(GOOGLE_ERRORS[error] ?? 'Sign-in failed. Please try again.')

    const match = document.cookie.match(/vms_token_pub=([^;]+)/)
    if (match) {
      try {
        const token = decodeURIComponent(match[1])
        const payload = JSON.parse(atob(token.split('.')[1]))
        localStorage.setItem('vms_token', token)
        localStorage.setItem(
          'vms_user',
          JSON.stringify({ id: payload.sub, name: payload.name, role: payload.role }),
        )
        document.cookie = 'vms_token_pub=; Max-Age=0; path=/'
        router.replace(['admin', 'staff'].includes(payload.role) ? '/admin' : '/')
      } catch {
        /* token parse failed */
      }
    }
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        name: name.trim(),
        password: password || undefined,
      }),
    })
    const data = (await res.json()) as any
    if (!res.ok) {
      toast.error(data.error ?? 'Registration failed')
      setLoading(false)
      return
    }

    const otpRes = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), type: 'register' }),
    })
    const otpData = (await otpRes.json()) as any
    setLoading(false)
    if (otpData.dev_code)
      toast(`Dev OTP: ${otpData.dev_code}`, { icon: '\u{1F511}', duration: 20000 })
    toast.success(`OTP sent to ${isPhone ? 'your phone' : 'your email'}`)
    localStorage.setItem('vms_token', data.token)
    localStorage.setItem('vms_user', JSON.stringify(data.user))
    setStep('otp')
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), code: otp, type: 'register' }),
    })
    const data = (await res.json()) as any
    setLoading(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Invalid OTP')
      return
    }
    localStorage.setItem('vms_token', data.token)
    localStorage.setItem('vms_user', JSON.stringify(data.user))
    toast.success('Account verified! Welcome to VMS \u{1F389}')
    router.push('/')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#050d1a' }}
    >
      <div
        className="dot-grid"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-white text-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
              boxShadow: '0 16px 48px rgba(0,194,255,0.3)',
            }}
          >
            V
          </div>
          <h1 className="font-display font-black text-on-surface text-2xl">Create Account</h1>
          <p className="text-on-surface-muted text-sm mt-1">Join VMS Pharmacy today</p>
        </div>

        <div className="glass rounded-3xl p-8">
          {step === 'details' && (
            <>
              {/* Google sign-up */}
              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full font-semibold text-sm transition-all mb-5 hover:bg-white/10"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#e2eaf4',
                }}
              >
                <GoogleIcon />
                Sign up with Google
              </a>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs text-on-surface-muted">or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="input-glass"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    inputMode="email"
                    placeholder="you@email.com or 9876543210"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    className="input-glass"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Password <span className="text-on-surface-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Min 8 characters (leave blank for OTP-only)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={8}
                    className="input-glass"
                  />
                  <p className="text-xs text-on-surface-muted mt-1">
                    You can always log in with OTP even without a password
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !identifier.trim()}
                  className="cta-btn w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
                >
                  {loading ? (
                    <Icon name="autorenew" className="animate-spin" />
                  ) : (
                    <Icon name="person_add" />
                  )}
                  {loading ? 'Creating\u2026' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(0,229,160,0.1)',
                    border: '1px solid rgba(0,229,160,0.25)',
                  }}
                >
                  <Icon name="mark_email_read" fill className="text-secondary text-[24px]" />
                </div>
                <p className="text-on-surface font-semibold">
                  Verify your {isPhone ? 'phone' : 'email'}
                </p>
                <p className="text-on-surface-muted text-sm mt-1">
                  Code sent to <span className="text-primary">{identifier}</span>
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="input-glass text-center text-2xl font-bold tracking-[0.4em]"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="cta-btn w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
              >
                {loading ? (
                  <Icon name="autorenew" className="animate-spin" />
                ) : (
                  <Icon name="verified" />
                )}
                {loading ? 'Verifying\u2026' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="text-xs text-on-surface-muted hover:text-primary transition-colors text-center"
              >
                \u2190 Go back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-on-surface-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
