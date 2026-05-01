import Link from 'next/link'

interface Props {
  emoji?: string
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { href?: string; onClick?: () => void; label: string }
}

/** Centred empty-state card for zero-result screens. */
export function EmptyState({ emoji, icon, title, description, action }: Props) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 40px',
        background: 'rgba(10,20,45,0.6)',
        borderRadius: 20,
        border: '1px solid rgba(0,194,255,0.1)',
      }}
    >
      {emoji && <div style={{ fontSize: 52, marginBottom: 18 }}>{emoji}</div>}
      {icon && (
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      )}
      <h3
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          color: '#e8f4fd',
          marginBottom: 10,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            color: '#8fafc7',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            marginBottom: 28,
          }}
        >
          {description}
        </p>
      )}
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            style={{
              padding: '11px 26px',
              borderRadius: 100,
              background: 'linear-gradient(135deg,#00c2ff,#7c3aed)',
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'Manrope, sans-serif',
              fontSize: 14,
            }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            style={{
              padding: '11px 26px',
              borderRadius: 100,
              background: 'linear-gradient(135deg,#00c2ff,#7c3aed)',
              color: '#fff',
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {action.label}
          </button>
        ))}
    </div>
  )
}
