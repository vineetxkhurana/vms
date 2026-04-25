interface Props {
  label: string
  title: React.ReactNode
  className?: string
}

/** Eyebrow label + page title — used on every shop and admin page. */
export function PageHeader({ label, title, className = '' }: Props) {
  return (
    <div className={className}>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#00c2ff',
        textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
      }}>
        {label}
      </span>
      <h1 style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 800,
        fontSize: 'clamp(22px, 3vw, 36px)', color: '#e8f4fd', marginTop: 6,
      }}>
        {title}
      </h1>
    </div>
  )
}
