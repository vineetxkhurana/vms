import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Refund Policy - VMS Store',
  description: 'VMS Store refund policy - eligibility, process, timelines, and exceptions.',
}

export default function RefundPage() {
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
              <Icon name="currency_rupee" fill className="text-primary text-[24px]" />
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
                Refund Policy
              </h1>
            </div>
          </div>

          <p className="text-sm mb-8" style={{ color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>
            Last updated: June 2026
          </p>

          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            {[
              {
                title: 'Eligibility',
                content:
                  'Refunds are considered for products that are damaged, defective, or incorrect at the time of delivery. Eligibility is determined on a case-by-case basis. Items must be unused and in their original packaging unless the defect was apparent at delivery.',
              },
              {
                title: 'Request Process',
                content:
                  'To request a refund, contact us within 48 hours of delivery with your order number, a description of the issue, and supporting photographs. We will review your request and respond within 2 business days.',
              },
              {
                title: 'Refund Timelines',
                content:
                  'Once approved, refunds are processed within 5-7 business days. The amount is credited to your original payment method. Depending on your bank or card issuer, it may take an additional 2-5 business days to reflect in your account.',
              },
              {
                title: 'Non-Refundable Items',
                content:
                  'The following items are not eligible for refund: opened or used products (unless defective), perishable goods, customized products, products damaged due to improper use or storage, and products purchased more than 7 days ago.',
              },
              {
                title: 'Partial Refunds',
                content:
                  'In certain cases, partial refunds may be issued for orders where only a portion of the items is returned or where the items are returned in used condition.',
              },
              {
                title: 'Shipping Costs',
                content:
                  'Original shipping charges are non-refundable unless the refund is due to our error. Return shipping costs for eligible refunds will be borne by VMS Store.',
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
