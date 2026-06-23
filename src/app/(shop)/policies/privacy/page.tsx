import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Privacy Policy - VMS Store',
  description: 'How VMS Store collects, uses, stores, and protects your personal data.',
}

export default function PrivacyPage() {
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
              <Icon name="lock" fill className="text-primary text-[24px]" />
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
                Privacy Policy
              </h1>
            </div>
          </div>

          <p className="text-sm mb-8" style={{ color: '#8fafc7', fontFamily: 'Inter, sans-serif' }}>
            Last updated: June 2026
          </p>

          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            {[
              {
                title: 'Information We Collect',
                content:
                  'We collect information you provide directly: name, email address, phone number, shipping address, and payment details. Payment details are processed by Razorpay and are never stored on our servers. We also collect certain technical information automatically: IP address, browser type, device information, and usage data through cookies and similar technologies.',
              },
              {
                title: 'How We Use Your Information',
                content:
                  'We use your information to process orders, deliver products, communicate order status, provide customer support, send relevant offers (with your consent), improve our website, and comply with legal obligations.',
              },
              {
                title: 'Data Sharing',
                content:
                  'We share your information only with trusted third-party service providers essential to order fulfillment: payment processors (Razorpay), delivery partners, and analytics providers (Sentry). We do not sell your personal data to third parties.',
              },
              {
                title: 'Data Security',
                content:
                  'We implement industry-standard security measures including encryption (TLS), secure payment processing via Razorpay, and limited employee access to personal data. However, no method of transmission over the internet is 100% secure.',
              },
              {
                title: 'Data Retention',
                content:
                  'We retain your personal data as long as your account is active or as needed to provide services. After account closure, we retain data only as required by applicable laws and for legitimate business purposes.',
              },
              {
                title: 'Your Rights',
                content:
                  'You have the right to access, correct, or delete your personal data. You may also request restriction of processing or data portability. To exercise these rights, contact us through the information provided on our website.',
              },
              {
                title: 'Cookies',
                content:
                  'We use essential cookies for authentication and cart functionality. Analytics cookies help us understand site usage. You can manage cookie preferences through your browser settings.',
              },
              {
                title: 'Changes to Privacy Policy',
                content:
                  'We may update this policy periodically. Changes will be posted on this page with an updated date. We encourage you to review this policy regularly.',
              },
              {
                title: 'Contact',
                content:
                  'For privacy-related inquiries, please visit our store in Makhu, Punjab, or contact us through the details listed on our website.',
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
