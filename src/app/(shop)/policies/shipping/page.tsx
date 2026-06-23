import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Shipping Policy - VMS Store',
  description: 'VMS Store shipping policy - delivery areas, timelines, charges, and tracking.',
}

export default function ShippingPage() {
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
              <Icon name="local_shipping" fill className="text-primary text-[24px]" />
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
                Shipping Policy
              </h1>
            </div>
          </div>

          <p className="text-sm mb-8" style={{ color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>
            Last updated: June 2026
          </p>

          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            {[
              {
                title: 'Delivery Area',
                content:
                  'We currently deliver to Makhu and surrounding areas in Punjab. Local delivery is handled by our in-house team and trusted local courier partners. For orders outside our standard delivery zone, please contact us to check availability.',
              },
              {
                title: 'Delivery Timelines',
                content:
                  'Orders are typically delivered within 24-48 hours for local deliveries. Delivery times may vary during peak periods, holidays, or inclement weather. We strive to keep you informed of any delays via your registered contact number.',
              },
              {
                title: 'Shipping Charges',
                content:
                  'Delivery is free for orders above a certain amount (subject to change). A nominal shipping fee applies to smaller orders. The applicable charge is displayed at checkout before you confirm your order.',
              },
              {
                title: 'Order Processing',
                content:
                  'Orders placed before 4 PM on business days are usually processed the same day. Orders placed after 4 PM or on holidays are processed the next business day. You will receive a confirmation once your order is dispatched.',
              },
              {
                title: 'Tracking',
                content:
                  'For tracked shipments, we share the tracking number via your registered phone number and email. You can also check your order status by logging into your account on our website.',
              },
              {
                title: 'Delivery Issues',
                content:
                  'If you encounter any issues with delivery - such as delays, damaged packages, or incorrect items - please contact us immediately with your order number. We will investigate and resolve the issue promptly.',
              },
              {
                title: 'Address Accuracy',
                content:
                  'Please ensure your delivery address and phone number are correct at the time of ordering. We are not responsible for failed deliveries due to incorrect address information provided by the customer.',
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
