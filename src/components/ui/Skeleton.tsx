/** Skeleton rows for a <tbody> — pass columns widths as px numbers or 'auto'. */
export function SkeletonRows({ rows = 5, cols }: { rows?: number; cols: (number | 'auto')[] }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid rgba(0,194,255,0.06)' }}>
          {cols.map((w, j) => (
            <td key={j} className="px-4 py-4">
              <div className="skeleton rounded-lg" style={{ height: 18, width: w === 'auto' ? '100%' : w }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Skeleton cards stacked vertically — for list pages. */
export function SkeletonList({ count = 3, height = 100 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton rounded-2xl" style={{ height }} />
      ))}
    </div>
  )
}

/** Skeleton product grid cards. */
export function SkeletonGrid({ count = 8, height = 280, minColWidth = 220 }: { count?: number; height?: number; minColWidth?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`, gap: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton rounded-2xl" style={{ height }} />
      ))}
    </div>
  )
}
