import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'

export const metadata: Metadata = {
  title: 'Policies - VMS Store',
  description:
    'Review VMS Store policies including terms and conditions, refund policy, cancellation policy, privacy policy, and shipping policy.',
}

const POLICIES = [
  {
    icon: 'description',
    title: 'Terms & Conditions',
    desc: 'Terms of service, account registration, pricing, and usage guidelines.',
    href: '/policies/terms',
  },
  {
    icon: 'currency_rupee',
    title: 'Refund Policy',
    desc: 'Refund eligibility, processes, timelines, and exceptions.',
    href: '/policies/refund',
  },
  {
    icon: 'cancel',
    title: 'Cancellation Policy',
    desc: 'How and when orders can be cancelled before and after dispatch.',
    href: '/policies/cancellation',
  },
  {
    icon: 'lock',
    title: 'Privacy Policy',
    desc: 'How we collect, use, store, and protect your personal data.',
    href: '/policies/privacy',
  },
  {
    icon: 'local_shipping',
    title: 'Shipping Policy',
    desc: 'Delivery areas, timelines, charges, and order tracking.',
    href: '/policies/shipping',
  },
]

export default function PoliciesPage() {
  return (
    <div
      className="min-h-screen px-6 lg:px-20"
      style={{ paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}
          >
            <Icon name="description" fill className="text-primary" style={{ fontSize: 40 }} />
          </div>
          <PageHeader label="Policies" title="Store Policies" className="mb-4" />
          <p
            className="text-on-surface-muted max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 16 }}
          >
            These policies govern your use of VMS Store. Please review them carefully before placing
            an order.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {POLICIES.map(p => (
            <Link
              key={p.href}
              href={p.href}
              className="glass rounded-2xl p-6 flex gap-5 items-start glass-hover transition-all duration-300 hover:-translate-y-0.5"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(0,194,255,0.08)',
                  border: '1px solid rgba(0,194,255,0.18)',
                }}
              >
                <Icon name={p.icon} fill className="text-primary text-[24px]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-on-surface mb-1.5">{p.title}</h3>
                <p className="text-sm text-on-surface-muted leading-relaxed">{p.desc}</p>
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
                  style={{ color: '#00c2ff' }}
                >
                  Read full policy
                  <Icon name="arrow_forward" className="text-[14px]" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
