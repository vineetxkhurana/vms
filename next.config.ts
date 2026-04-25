import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
  { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.r2.dev https://pub-*.r2.dev",
      "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  // better-sqlite3 is a native module used only in local dev — never bundle it
  serverExternalPackages: ['better-sqlite3'],
  webpack(config) {
    // Suppress bcryptjs crypto warning (works at runtime via nodejs_compat)
    config.resolve.fallback = { ...config.resolve.fallback, crypto: false }
    // Treat native-module chain as externals so edge bundles don't try to inline them
    const nativeExternals = ['better-sqlite3', 'bindings', 'file-uri-to-path']
    const existing = Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []
    config.externals = [
      ...existing,
      ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
        if (request && nativeExternals.includes(request)) return callback(null, `commonjs ${request}`)
        callback()
      },
    ]
    return config
  },
}

export default nextConfig

