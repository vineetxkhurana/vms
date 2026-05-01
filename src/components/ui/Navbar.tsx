'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { Icon } from './Icon'

const NAV_LINKS = [
  { href: '/',         label: 'Home',    exact: true },
  { href: '/products', label: 'Products', exact: false },
  { href: '/orders',   label: 'Orders',   exact: false },
  { href: '/trust',    label: 'Trust & Licenses', exact: false },
]

const BOTTOM_TABS = [
  { href: '/',         label: 'Home',    icon: 'home' },
  { href: '/products', label: 'Shop',    icon: 'medication' },
  { href: '/cart',     label: 'Cart',    icon: 'shopping_cart' },
  { href: '/orders',   label: 'Orders',  icon: 'receipt_long' },
  { href: '/account',  label: 'Account', icon: 'person' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { items } = useCart()
  const { user, ready, signOut } = useAuth()
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {/* ─────── DESKTOP: floating pill nav (hidden on mobile) ─────── */}
      <nav
        className="nav-desktop"
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: `translateX(-50%) scale(${scrolled ? 0.97 : 1})`,
          zIndex: 1000,
          width: 'min(900px, 92vw)',
          background: 'rgba(5,13,26,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${scrolled ? 'rgba(0,194,255,0.25)' : 'rgba(0,194,255,0.1)'}`,
          borderRadius: 100,
          padding: '10px 24px',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'transform 0.3s ease, border-color 0.3s ease',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image src="/vms-logo.svg" alt="VMS" width={110} height={36} priority style={{ height: 34, width: 'auto' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(({ href, label, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href} style={{
                padding: '6px 16px', borderRadius: 100, fontFamily: 'Inter, sans-serif',
                fontWeight: 500, fontSize: 14,
                color: active ? '#050d1a' : '#8fafc7',
                background: active ? 'linear-gradient(135deg, #00c2ff, #0077ff)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s ease',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/cart" style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)',
            textDecoration: 'none', color: '#00c2ff',
          }}>
            <Icon name="shopping_cart" className="text-[20px]" />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, background: '#00e5a0',
                color: '#050d1a', borderRadius: 100, fontSize: 10, fontWeight: 700,
                padding: '1px 5px', minWidth: 18, textAlign: 'center',
              }}>{cartCount}</span>
            )}
          </Link>
          {ready && (user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: '#8fafc7', fontFamily: 'Inter, sans-serif',
                maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.name.split(' ')[0]}
              </span>
              <button onClick={signOut} style={{
                padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif',
              }}>Sign Out</button>
            </div>
          ) : (
            <Link href="/login" style={{
              padding: '7px 18px', borderRadius: 100,
              background: 'linear-gradient(135deg, #00c2ff, #7c3aed)',
              color: '#fff', fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif',
              textDecoration: 'none',
            }}>Sign In</Link>
          ))}
        </div>
      </nav>

      {/* ─────── MOBILE: compact top header (hidden on desktop) ─────── */}
      <header
        className="nav-mobile"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 1000,
          background: 'rgba(3,8,18,0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,194,255,0.08)',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Image src="/vms-logo.svg" alt="VMS" width={90} height={30} priority style={{ height: 28, width: 'auto' }} />
        </Link>
        <Link href="/cart" style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.15)',
          textDecoration: 'none', color: '#00c2ff',
        }}>
          <Icon name="shopping_cart" className="text-[20px]" />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, background: '#00e5a0',
              color: '#050d1a', borderRadius: 100, fontSize: 9, fontWeight: 800,
              padding: '1px 5px', minWidth: 16, textAlign: 'center', lineHeight: '14px',
            }}>{cartCount}</span>
          )}
        </Link>
      </header>

      {/* ─────── MOBILE: bottom tab bar (hidden on desktop) ─────── */}
      <nav
        className="nav-mobile"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
          paddingTop: 10,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          paddingLeft: 16, paddingRight: 16,
          background: 'rgba(3,8,18,0.92)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(0,194,255,0.08)',
          flexDirection: 'column',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,194,255,0.35), transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {BOTTOM_TABS.map(({ href, label, icon }) => {
            const active = isActive(href, href === '/')
            return (
              <Link key={href} href={href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                textDecoration: 'none', position: 'relative', flex: 1, padding: '6px 4px',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 48, height: 34, borderRadius: 17,
                    background: 'linear-gradient(135deg, rgba(0,194,255,0.18), rgba(124,58,237,0.18))',
                    border: '1px solid rgba(0,194,255,0.25)',
                    boxShadow: '0 0 16px rgba(0,194,255,0.12)',
                  }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <Icon name={icon} fill={active} className="text-[22px]"
                    style={{ color: active ? '#00c2ff' : '#4a6480', transition: 'color 0.2s' }} />
                  <span style={{
                    fontSize: 10, fontFamily: 'Inter, sans-serif',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#00c2ff' : '#4a6480',
                    transition: 'color 0.2s',
                  }}>{label}</span>
                </div>
                {icon === 'shopping_cart' && cartCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: '18%',
                    background: 'linear-gradient(135deg, #00e5a0, #00c2ff)',
                    color: '#050d1a', borderRadius: 100, fontSize: 9, fontWeight: 800,
                    padding: '1px 5px', minWidth: 16, textAlign: 'center', lineHeight: '14px',
                    boxShadow: '0 2px 8px rgba(0,229,160,0.4)',
                  }}>{cartCount}</span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
