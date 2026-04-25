import { Icon } from './Icon'
import { STATUS_CONFIG } from '@/lib/status'

interface Props {
  status: string
  /** Show the icon alongside the label */
  icon?: boolean
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, icon = false, size = 'md' }: Props) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#8fafc7', icon: 'circle', label: status }
  const pad = size === 'sm' ? '2px 10px' : '4px 14px'
  const fs  = size === 'sm' ? 11 : 12

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 100, fontSize: fs, fontWeight: 700,
      fontFamily: 'Inter, sans-serif', textTransform: 'capitalize',
      background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, color: cfg.color,
    }}>
      {icon && <Icon name={cfg.icon} fill className="text-[13px]" />}
      {cfg.label}
    </span>
  )
}
