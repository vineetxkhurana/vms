import type { Metadata } from 'next'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'

export const metadata: Metadata = {
  title: 'Trust & Licenses — Vipan Medical Store',
  description:
    'Vipan Medical Store is a fully licensed pharmacy. View our drug licenses, FSSAI certification, GST registration, and trust credentials.',
}

const CERTS = [
  {
    icon: 'verified',
    name: 'Drug License (Form 20 & 21)',
    number: 'DL No: [DL-XXXX-XXXX]',
    note: 'Issued by State Drug Controller',
  },
  {
    icon: 'restaurant',
    name: 'FSSAI License',
    number: 'No: [FSSAI-XXXXXXXXX]',
    note: 'Food Safety & Standards Authority of India',
  },
  {
    icon: 'receipt_long',
    name: 'GST Registration',
    number: 'GSTIN: [XX-XXXXX-XXXX]',
    note: 'Registered under Goods & Services Tax Act',
  },
  {
    icon: 'store',
    name: 'Shop & Establishment Act',
    number: 'Reg No: [SE-XXXX]',
    note: 'Registered with local municipal authority',
  },
  {
    icon: 'workspace_premium',
    name: 'ISO 9001:2015',
    number: 'Cert No: [ISO-XXXX] (if applicable)',
    note: 'Quality Management System — optional',
    optional: true,
  },
]

const PILLARS = [
  {
    icon: 'check_circle',
    color: '#00e5a0',
    title: 'Genuine Medicines Only',
    desc: 'Every product is sourced exclusively from licensed and authorized distributors and manufacturers.',
  },
  {
    icon: 'local_shipping',
    color: '#00c2ff',
    title: 'Local Delivery in 24–48 Hours',
    desc: 'Serving Amritsar and surrounding areas with reliable same-day to next-day local courier delivery.',
  },
  {
    icon: 'ac_unit',
    color: '#7c3aed',
    title: 'Cold Chain Maintained',
    desc: 'Temperature-sensitive medicines are stored and transported with proper cold chain protocols.',
  },
  {
    icon: 'medical_services',
    color: '#00e5a0',
    title: 'Expert Pharmacist Consultation',
    desc: 'Our qualified pharmacists are available in-store for guidance on dosage, interactions, and alternatives.',
  },
]

export default function TrustPage() {
  return (
    <div
      className="min-h-screen px-6 lg:px-20"
      style={{ paddingTop: 'var(--page-pt)', paddingBottom: 'var(--page-pb)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="mb-16 text-center">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}
          >
            <Icon name="verified" fill className="text-primary" style={{ fontSize: 40 }} />
          </div>
          <PageHeader
            label="Licensed & Trusted"
            title="Licensed & Trusted Pharmacy"
            className="mb-4"
          />
          <p
            className="text-on-surface-muted max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: 16 }}
          >
            Vipan Medical Store is a fully licensed pharmacy operating since 1999. All our medicines
            are sourced directly from authorized distributors and manufacturers — never from
            unverified or grey-market channels.
          </p>
        </div>

        {/* ── CERTIFICATIONS GRID ──────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8">
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
              Our Credentials
            </span>
            <h2
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(22px, 3vw, 32px)',
                color: '#e8f4fd',
                marginTop: 6,
              }}
            >
              Certifications &amp; Licenses
            </h2>
          </div>

          {/* Admin note */}
          <div
            className="mb-8 flex items-start gap-3 rounded-xl p-4"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <Icon
              name="info"
              fill
              className="text-[18px] flex-shrink-0 mt-0.5"
              style={{ color: '#a78bfa' }}
            />
            <p className="text-sm" style={{ color: '#a78bfa', fontFamily: 'Inter, sans-serif' }}>
              <strong>Admin note:</strong> Replace the placeholder numbers in brackets with your
              actual license numbers. You can also upload scanned certificate images alongside each
              card.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CERTS.map(cert => (
              <div
                key={cert.name}
                className="glass rounded-2xl p-6 flex flex-col gap-4 glass-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(0,194,255,0.08)',
                      border: '1px solid rgba(0,194,255,0.18)',
                    }}
                  >
                    <Icon name={cert.icon} fill className="text-primary text-[24px]" />
                  </div>
                  {cert.optional ? (
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: 'rgba(124,58,237,0.15)',
                        color: '#a78bfa',
                        border: '1px solid rgba(124,58,237,0.25)',
                      }}
                    >
                      Optional
                    </span>
                  ) : (
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
                      style={{
                        background: 'rgba(0,229,160,0.12)',
                        color: '#00e5a0',
                        border: '1px solid rgba(0,229,160,0.25)',
                      }}
                    >
                      <Icon name="check_circle" fill className="text-[12px]" />
                      Valid &amp; Active
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-on-surface text-base mb-1">
                    {cert.name}
                  </h3>
                  <p className="text-sm font-mono mb-2" style={{ color: '#00c2ff' }}>
                    {cert.number}
                  </p>
                  <p className="text-xs text-on-surface-muted">{cert.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHY BUY FROM US ──────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8">
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
              Why Us
            </span>
            <h2
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(22px, 3vw, 32px)',
                color: '#e8f4fd',
                marginTop: 6,
              }}
            >
              Why Buy From Us
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PILLARS.map(p => (
              <div
                key={p.title}
                className="glass rounded-2xl p-6 flex gap-5 items-start glass-hover transition-all duration-300 hover:-translate-y-0.5"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${p.color}12`, border: `1px solid ${p.color}28` }}
                >
                  <Icon name={p.icon} fill className="text-[24px]" style={{ color: p.color }} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-on-surface mb-2">{p.title}</h4>
                  <p className="text-sm text-on-surface-muted leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SOURCE & QUALITY ─────────────────────────────── */}
        <section className="mb-16">
          <div
            className="glass rounded-2xl p-8 flex gap-6 items-start"
            style={{ borderColor: 'rgba(0,229,160,0.2)' }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(0,229,160,0.08)',
                border: '1px solid rgba(0,229,160,0.22)',
              }}
            >
              <Icon name="science" fill className="text-[28px]" style={{ color: '#00e5a0' }} />
            </div>
            <div>
              <h3 className="font-display font-bold text-on-surface text-lg mb-3">
                Source &amp; Quality Assurance
              </h3>
              <p
                className="text-on-surface-muted leading-relaxed"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                All medicines are procured from authorized stockists and carry manufacturer batch
                numbers and expiry tracking. We never stock expired or near-expired medicines. Each
                product is verified against the manufacturer&apos;s catalogue before shelving,
                ensuring you always receive genuine, full-potency medication.
              </p>
            </div>
          </div>
        </section>

        {/* ── CONTACT / VERIFY ─────────────────────────────── */}
        <section>
          <div className="mb-8">
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
              Visit Us
            </span>
            <h2
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(22px, 3vw, 32px)',
                color: '#e8f4fd',
                marginTop: 6,
              }}
            >
              Verify In Person
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 flex flex-col gap-3">
              <Icon name="location_on" fill className="text-primary text-[28px]" />
              <h4 className="font-display font-bold text-on-surface">Our Address</h4>
              <p className="text-sm text-on-surface-muted leading-relaxed">
                Vipan Medical Store
                <br />
                [Shop Address, Street]
                <br />
                Amritsar, Punjab, India
              </p>
              <p className="text-xs text-on-surface-muted">
                You can visit our store to verify our licenses in person.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 flex flex-col gap-3">
              <Icon name="call" fill className="text-primary text-[28px]" />
              <h4 className="font-display font-bold text-on-surface">Phone</h4>
              <a
                href="tel:+919XXXXXXXXX"
                className="text-primary font-semibold hover:underline"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                +91-9XXXXXXXXX
              </a>
              <p className="text-xs text-on-surface-muted">Available Mon–Sat, 9 AM – 8 PM</p>
            </div>

            <div className="glass rounded-2xl p-6 flex flex-col gap-3">
              <Icon name="chat" fill className="text-[28px]" style={{ color: '#25d366' }} />
              <h4 className="font-display font-bold text-on-surface">WhatsApp</h4>
              <a
                href="https://wa.me/919XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: '#25d366', fontFamily: 'Inter, sans-serif' }}
              >
                Chat on WhatsApp
              </a>
              <p className="text-xs text-on-surface-muted">
                Quick queries, prescription uploads, order status
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
