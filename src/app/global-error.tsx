'use client'
// Catches React rendering errors in the App Router root layout.
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body
        style={{
          background: '#050d1a',
          color: '#e8f4fd',
          fontFamily: 'system-ui',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 16,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 48 }}>⚠️</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: '#8fafc7', maxWidth: 400, margin: 0 }}>
          We&apos;ve been notified. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg,#00c2ff,#7c3aed)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
