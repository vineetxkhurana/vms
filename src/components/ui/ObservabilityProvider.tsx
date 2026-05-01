'use client'
/**
 * ObservabilityProvider
 * - Sentry is initialised via sentry.client.config.ts (Next.js SDK convention)
 * - This component adds: Web Vitals reporting, ErrorBoundary
 * - Gracefully does nothing when DSN is absent
 */
import { useEffect, Component, type ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { distribution } from '@/lib/observability'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

function WebVitalsReporter() {
  // report-web-vitals hook is Next.js built-in — no extra package needed
  useEffect(() => {
    if (typeof window === 'undefined' || !DSN) return

    // Use PerformanceObserver to capture Core Web Vitals
    const reportVital = (name: string, value: number) => {
      distribution('web_vitals', value, 'millisecond', { metric: name })
      Sentry.addBreadcrumb({ category: 'web-vitals', message: name, data: { value }, level: 'info' })
    }

    // LCP
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1] as any
        reportVital('LCP', last.renderTime || last.loadTime)
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    } catch { /* unsupported browser */ }

    // FID / INP
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          reportVital('FID', entry.processingStart - entry.startTime)
        }
      }).observe({ type: 'first-input', buffered: true })
    } catch { /* unsupported browser */ }

    // CLS
    let clsValue = 0
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!(entry as any).hadRecentInput) clsValue += (entry as any).value
        }
        reportVital('CLS', clsValue * 1000) // scale to ms-equivalent for Sentry
      }).observe({ type: 'layout-shift', buffered: true })
    } catch { /* unsupported browser */ }

    // TTFB via navigation timing
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav) reportVital('TTFB', nav.responseStart - nav.requestStart)
  }, [])

  return null
}

type EBState = { error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null }

  static getDerivedStateFromError(error: Error): EBState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (DSN) Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#050d1a', color: '#e8f4fd', fontFamily: 'system-ui',
          gap: 16, padding: 32, textAlign: 'center',
        }}>
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#8fafc7', maxWidth: 400, margin: 0 }}>
            We&apos;ve been notified and are looking into it. Please refresh the page.
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#00c2ff,#7c3aed)', color: '#fff',
              fontWeight: 700, fontSize: 14,
            }}
          >
            Refresh page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ color: '#ef4444', fontSize: 12, textAlign: 'left', maxWidth: '80vw', overflow: 'auto' }}>
              {this.state.error.stack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export function ObservabilityProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <WebVitalsReporter />
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  )
}
