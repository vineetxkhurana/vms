'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Icon } from '@/components/ui/Icon'

type Step = 'identifier' | 'otp' | 'password'

const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled:        'Google sign-in was cancelled.',
  oauth_misconfigured:     'Google sign-in is not configured yet.',
  google_token_failed:     'Failed to authenticate with Google. Please try again.',
  google_profile_failed:   'Could not retrieve your Google profile.',
  google_email_unverified: 'Your Google account email is not verified.',
  db_unavailable:          'Service temporarily unavailable.',
  user_creation_failed:    'Could not create your account. Please try again.',
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.233 17.64 11.925 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [step, setStep]             = useState<Step>('identifier')
  const [otp, setOtp]               = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)

  const isPhone = /^[6-9]\d{9}$/.test(identifier.trim())

  // Handle Google OAuth redirect: show errors, sync pub-cookie -> localStorage
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) toast.error(GOOGLE_ERRORS[error] ?? 'Sign-in failed. Please try again.')

    const match = document.cookie.match(/vms_token_pub=([^;]+)/)
    if (match) {
      try {
        const token = decodeURIComponent(match[1])
        const payload = JSON.parse(atob(token.split('.')[1]))
        localStorage.setItem('vms_token', token)
        localStorage.setItem('vms_user', JSON.stringify({ id: payload.sub, name: payload.name, role: payload.role }))
        document.cookie = 'vms_token_pub=; Max-Age=0; path=/'
        router.replace(['admin', 'staff'].includes(payload.role) ? '/admin' : '/')
      } catch { /* token parse failed */ }
    }
  }, [router])

  const sendOTP = async () => {
    setLoading(true)
    const res  = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), type: 'login' }),
    })
    const data = await res.json() as any
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Failed to send OTP'); return }
    toast.success(`OTP sent to ${isPhone ? 'your phone' : 'your email'}. Check server console in dev mode.`)
    setStep('otp')
  }

  const verifyOTP = async () => {
    setLoading(true)
    const res  = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), code: otp, type: 'login' }),
    })
    const data = await res.json() as any
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Invalid OTP'); return }
    localStorage.setItem('vms_token', data.token)
    localStorage.setItem('vms_user', JSON.stringify(data.user))
    toast.success('Welcome back!')
    router.push(data.user.role === 'admin' || data.user.role === 'staff' ? '/admin' : '/')
  }

  const loginPassword = async () => {
    setLoading(true)
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    })
    const data = await res.json() as any
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Login failed'); return }
    localStorage.setItem('vms_token', data.token)
    localStorage.setItem('vms_user', JSON.stringify(data.user))
    toast.success('Welcome back!')
    router.push(data.user.role === 'admin' || data.user.role === 'staff' ? '/admin' : '/')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'identifier') sendOTP()
    else if (step === 'otp')   verifyOTP()
    else                       loginPassword()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050d1a' }}>
      <div className="dot-grid" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-white text-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #00c2ff, #7c3aed)', boxShadow: '0 16px 48px rgba(0,194,255,0.3)' }}
          >V</div>
          <h1 className="font-display font-black text-on-surface text-2xl">Sign in to VMS</h1>
          <p className="text-on-surface-muted text-sm mt-1">Trusted pharmacy since 2000</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8">
          {/* Google sign-in — shown only on the first step */}
          {step === 'identifier' && (
            <>
              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full font-semibold text-sm transition-all mb-5 hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2eaf4' }}
              >
                <GoogleIcon />
                Continue with Google
              </a>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs text-on-surface-muted">or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
            </>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {(['identifier','otp'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step === s ? 'linear-gradient(135deg,#00c2ff,#7c3aed)' : i < (['identifier','otp','password'] as Step[]).indexOf(step) ? 'rgba(0,229,160,0.2)' : 'rgba(255,255,255,0.05)',
                    color: step === s ? '#fff' : '#8fafc7',
                    border: step === s ? 'none' : '1px solid rgba(0,194,255,0.15)',
                  }}
                >
                  {i + 1}
                </div>
                {i === 0 && <div className="flex-1 h-px" style={{ background: 'rgba(0,194,255,0.12)', width: 40 }} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === 'identifier' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Email or Phone</label>
                  <input
                    type="text"
                    inputMode="email"
                    placeholder="you@email.com or 9876543210"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                    autoFocus
                    className="input-glass"
                  />
                  <p className="text-xs text-on-surface-muted mt-2">We'll send you a one-time code</p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="cta-btn w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
                >
                  {loading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="send" />}
                  {loading ? 'Sending\u2026' : 'Send OTP'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setStep('password')} className="text-xs text-on-surface-muted hover:text-primary transition-colors">
                    Use password instead \u2192
                  </button>
                </div>
              </>
            )}

            {step === 'otp' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">
                    Enter 6-digit OTP sent to <span className="text-primary">{identifier}</span>
                  </label>
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
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="cta-btn w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
                >
                  {loading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="check_circle" />}
                  {loading ? 'Verifying\u2026' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => { setStep('identifier'); setOtp('') }} className="text-xs text-on-surface-muted hover:text-primary transition-colors text-center">
                  \u2190 Change email/phone
                </button>
                <button type="button" onClick={sendOTP} className="text-xs text-primary hover:underline text-center">
                  Resend OTP
                </button>
              </>
            )}

            {step === 'password' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Email or Phone</label>
                  <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required className="input-glass" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Password</label>
                  <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus className="input-glass" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="cta-btn w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
                >
                  {loading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="lock" />}
                  {loading ? 'Signing in\u2026' : 'Sign In'}
                </button>
                <button type="button" onClick={() => setStep('identifier')} className="text-xs text-on-surface-muted hover:text-primary transition-colors text-center">
                  Use OTP instead \u2192
                </button>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-muted mt-6">
          New here?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  )
}
