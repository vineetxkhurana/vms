import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Cancellation Policy - VMS Store',
  description: 'VMS Store cancellation policy - how and when orders can be cancelled.',
}

export default function CancellationPage() {
  return (
    <div
      className="min-h-screen px-6 lg:px-20"
      style={{ paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/policies"
          className="inline-flex items-center gap-1.5 text-sm font-semibold mb-8 transition-colors"
          style={{ color: '#8fafc7' }}
        >
          <Icon name="arrow_back" className="text-[16px]" />
          Back to Policies
        </Link>

        <div className="glass rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(0,194,255,0.08)',
                border: '1px solid rgba(0,194,255,0.18)',
              }}
            >
              <Icon name="cancel" fill className="text-primary text-[24px]" />
            </div>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: '#00c2ff',
                  textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Policy
              </span>
              <h1
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(22px, 3vw, 32px)',
                  color: '#e8f4fd',
                  marginTop: 4,
                }}
              >
                Cancellation Policy
              </h1>
            </div>
          </div>

          <p className="text-sm mb-8" style={{ color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>
            Last updated: June 2026
          </p>

          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            {[
              {
                title: 'Before Dispatch',
                content:
                  'Orders can be cancelled free of charge before they are dispatched. To cancel, log in to your account and navigate to your orders, or contact us directly with your order number. The full amount will be refunded to your original payment method within 3-5 business days.',
              },
              {
                title: 'After Dispatch',
                content:
                  'Once an order has been dispatched, cancellation is not guaranteed. If you wish to cancel, please contact us immediately. If the shipment has already left our facility, we will guide you on how to refuse delivery or initiate a return upon receipt.',
              },
              {
                title: 'Partial Cancellation',
                content:
                  'We allow partial cancellation of multi-item orders before dispatch. You may remove individual items from your order. Pricing adjustments will be calculated based on the remaining items.',
              },
              {
                title: 'Cancellation by VMS Store',
                content:
                  'We reserve the right to cancel any order due to: product unavailability, pricing errors, suspected fraudulent activity, or payment failure. In such cases, you will be notified and a full refund will be issued promptly.',
              },
              {
                title: 'Refund After Cancellation',
                content:
                  'Refunds for cancellations are processed within 3-5 business days. The amount is credited to your original payment method. Depending on your bank or card issuer, additional time may be required for the amount to reflect in your account.',
              },
            ].map(section => (
              <div key={section.title} className="mb-8">
                <h2 className="font-display font-bold text-on-surface text-lg mb-3">
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: '#b0c8db' }}>
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
