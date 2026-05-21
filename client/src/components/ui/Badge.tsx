import React from 'react'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'accent'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  style?: React.CSSProperties
}

const variantColors: Record<BadgeVariant, { bg: string; color: string }> = {
  default:  { bg: 'var(--color-surface-2)', color: 'var(--color-text-muted)' },
  success:  { bg: 'rgba(34,197,94,0.15)',   color: 'var(--color-success)' },
  danger:   { bg: 'rgba(239,68,68,0.15)',   color: 'var(--color-danger)' },
  warning:  { bg: 'rgba(245,158,11,0.15)',  color: 'var(--color-warning)' },
  accent:   { bg: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' },
}

export function Badge({ variant = 'default', children, style }: BadgeProps) {
  const { bg, color } = variantColors[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        backgroundColor: bg,
        color,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
