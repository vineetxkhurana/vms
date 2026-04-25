'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Icon } from '@/components/ui/Icon'

type Step = 'identifier' | 'otp' | 'password'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [step, setStep]             = useState<Step>('identifier')
  const [otp, setOtp]               = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)

  const isPhone = /^[6-9]\d{9}$/.test(identifier.trim())

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
    if (data.dev_code) toast(`Dev OTP: ${data.dev_code}`, { icon: '🔑', duration: 20000 })
    toast.success(`OTP sent to ${isPhone ? 'your phone' : 'your email'}`)
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
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setStep('password')} className="text-xs text-on-surface-muted hover:text-primary transition-colors">
                    Use password instead →
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
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => { setStep('identifier'); setOtp('') }} className="text-xs text-on-surface-muted hover:text-primary transition-colors text-center">
                  ← Change email/phone
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
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <button type="button" onClick={() => setStep('identifier')} className="text-xs text-on-surface-muted hover:text-primary transition-colors text-center">
                  Use OTP instead →
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

