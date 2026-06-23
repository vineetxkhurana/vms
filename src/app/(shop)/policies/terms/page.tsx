import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Terms & Conditions - VMS Store',
  description: 'Terms and conditions governing the use of VMS Store and purchase of products.',
}

export default function TermsPage() {
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
              <Icon name="description" fill className="text-primary text-[24px]" />
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
                Terms &amp; Conditions
              </h1>
            </div>
          </div>

          <p className="text-sm mb-8" style={{ color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>
            Last updated: June 2026
          </p>

          <div className="prose prose-sm max-w-none" style={{ fontFamily: 'Inter, sans-serif' }}>
            {[
              {
                title: 'Introduction',
                content:
                  'These Terms and Conditions govern your use of the VMS Store website and your purchase of products from VMS Store. By accessing or using our website, you agree to be bound by these terms. If you do not agree, please do not use our services.',
              },
              {
                title: 'Account Registration',
                content:
                  'You may need to create an account to place orders. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate, current, and complete information.',
              },
              {
                title: 'Product Information',
                content:
                  'We strive to display accurate product descriptions, images, and pricing. However, we do not guarantee that descriptions or other content are error-free. In the event of a pricing error, we reserve the right to cancel or refuse the order.',
              },
              {
                title: 'Pricing & Payment',
                content:
                  'All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise. Payment must be made at the time of ordering. We accept payments via debit/credit cards, UPI, net banking, and Razorpay-powered payment methods. Your card details are processed securely by Razorpay and are never stored on our servers.',
              },
              {
                title: 'Order Acceptance',
                content:
                  'Placing an item in your cart does not guarantee availability. We reserve the right to accept or decline any order. If we cancel an order after payment, we will issue a full refund.',
              },
              {
                title: 'Intellectual Property',
                content:
                  'All content on this website - including text, images, logos, and design - is the property of VMS Store and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our written consent.',
              },
              {
                title: 'Limitation of Liability',
                content:
                  'VMS Store shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products. Our total liability is limited to the amount paid for the product in question.',
              },
              {
                title: 'Changes to Terms',
                content:
                  'We reserve the right to update these terms at any time. Changes will be posted on this page with an updated date. Continued use of the site after changes constitutes acceptance of the new terms.',
              },
              {
                title: 'Contact',
                content:
                  'For questions about these terms, please contact us at our store location in Makhu, Punjab, or via the contact information provided on our website.',
              },
            ].map(section => (
              <div key={section.title} className="mb-8">
                <h2
                  className="font-display font-bold text-on-surface text-lg mb-3"
                >
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
