import type React from 'react'

export function Icon({ name, className, fill, style }: { name: string; className?: string; fill?: boolean; style?: React.CSSProperties }) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ''}`}
      style={{ ...(fill ? { fontVariationSettings: "'FILL' 1" } : {}), ...style }}
    >
      {name}
    </span>
  )
}
