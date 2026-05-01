import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance — 20% of requests traced (free tier friendly)
  tracesSampleRate: 0.2,

  // Session replays off (saves quota)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Application Metrics
  _experiments: { enableLogs: true },

  integrations: [
    Sentry.browserTracingIntegration(),
  ],

  beforeSend(event) {
    // Strip IP addresses
    if (event.user) delete event.user.ip_address
    return event
  },
})
