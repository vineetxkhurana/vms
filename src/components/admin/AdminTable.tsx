import { SkeletonRows } from '@/components/ui/Skeleton'
import { Icon } from '@/components/ui/Icon'

interface Props {
  headers: string[]
  /** px widths for skeleton cells — length must match headers. 'auto' = stretch */
  skeletonCols?: (number | 'auto')[]
  skeletonRows?: number
  loading: boolean
  empty: boolean
  emptyIcon?: string
  emptyMessage?: string
  children: React.ReactNode
  /** Extra content appended after the table (e.g. pagination) */
  footer?: React.ReactNode
}

/**
 * Shared glass-card table wrapper used across all admin pages.
 * Handles loading skeletons and empty states automatically.
 */
export function AdminTable({
  headers, skeletonCols, skeletonRows = 6, loading, empty,
  emptyIcon = 'inbox', emptyMessage = 'No data found', children, footer,
}: Props) {
  const cols = skeletonCols ?? headers.map(() => 80)

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead style={{ borderBottom: '1px solid rgba(0,194,255,0.1)' }}>
          <tr>
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-4 text-xs font-bold text-on-surface-muted uppercase tracking-widest">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && <SkeletonRows rows={skeletonRows} cols={cols} />}
          {!loading && empty && (
            <tr>
              <td colSpan={headers.length} className="text-center py-16 text-on-surface-muted">
                <Icon name={emptyIcon} className="text-[48px] opacity-20 block mx-auto mb-3" />
                {emptyMessage}
              </td>
            </tr>
          )}
          {!loading && !empty && children}
        </tbody>
      </table>
      {footer}
    </div>
  )
}
