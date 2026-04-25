'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Icon } from '@/components/ui/Icon'

type Step = 'details' | 'otp' | 'done'

export default function RegisterPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [name, setName]             = useState('')
  const [password, setPassword]     = useState('')
  const [otp, setOtp]               = useState('')
  const [step, setStep]             = useState<Step>('details')
  const [loading, setLoading]       = useState(false)

  const isPhone = /^[6-9]\d{9}$/.test(identifier.trim())

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Register account
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), name: name.trim(), password: password || undefined }),
    })
    const data = await res.json() as any
    if (!res.ok) { toast.error(data.error ?? 'Registration failed'); setLoading(false); return }

    // Send OTP for verification
    const otpRes  = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), type: 'register' }),
    })
    const otpData = await otpRes.json() as any
    setLoading(false)
    if (otpData.dev_code) toast(`Dev OTP: ${otpData.dev_code}`, { icon: '🔑', duration: 20000 })
    toast.success(`OTP sent to ${isPhone ? 'your phone' : 'your email'}`)
    // Store token for after verification
    localStorage.setItem('vms_token', data.token)
    localStorage.setItem('vms_user', JSON.stringify(data.user))
    setStep('otp')
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res  = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), code: otp, type: 'register' }),
    })
    const data = await res.json() as any
    setLoading(false)
    if (!res.ok) { toast.error(data.error ?? 'Invalid OTP'); return }
    // Update token (now verified)
    localStorage.setItem('vms_token', data.token)
    localStorage.setItem('vms_user', JSON.stringify(data.user))
    toast.success('Account verified! Welcome to VMS 🎉')
    router.push('/')
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
          <h1 className="font-display font-black text-on-surface text-2xl">Create Account</h1>
          <p className="text-on-surface-muted text-sm mt-1">Join VMS Pharmacy today</p>
        </div>

        <div className="glass rounded-3xl p-8">
          {step === 'details' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Full Name</label>
                <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required className="input-glass" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Email or Phone</label>
                <input type="text" inputMode="email" placeholder="you@email.com or 9876543210" value={identifier} onChange={e => setIdentifier(e.target.value)} required className="input-glass" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">
                  Password <span className="text-on-surface-muted font-normal">(optional)</span>
                </label>
                <input type="password" placeholder="Min 8 characters (leave blank for OTP-only)" value={password} onChange={e => setPassword(e.target.value)} minLength={8} className="input-glass" />
                <p className="text-xs text-on-surface-muted mt-1">You can always log in with OTP even without a password</p>
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim() || !identifier.trim()}
                className="cta-btn w-full py-4 rounded-full font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', border: 'none' }}
              >
                {loading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="person_add" />}
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)' }}>
                  <Icon name="mark_email_read" fill className="text-secondary text-[24px]" />
                </div>
                <p className="text-on-surface font-semibold">Verify your {isPhone ? 'phone' : 'email'}</p>
                <p className="text-on-surface-muted text-sm mt-1">Code sent to <span className="text-primary">{identifier}</span></p>
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
                {loading ? <Icon name="autorenew" className="animate-spin" /> : <Icon name="verified" />}
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button type="button" onClick={() => setStep('details')} className="text-xs text-on-surface-muted hover:text-primary transition-colors text-center">
                ← Go back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-on-surface-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

