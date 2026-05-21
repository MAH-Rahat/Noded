import React from 'react'

interface BudgetProgressBarProps {
  spent: number
  limit: number
  label: string
}

export function BudgetProgressBar({ spent, limit, label }: BudgetProgressBarProps) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const isWarning = pct >= 80 && pct < 100
  const isOver = pct >= 100

  const barColor = isOver
    ? 'var(--color-danger)'
    : isWarning
    ? 'var(--color-warning)'
    : 'var(--color-accent)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', color: isOver ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
          ৳{spent.toLocaleString()} / ৳{limit.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          height: '4px',
          backgroundColor: 'var(--color-border)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: barColor,
            borderRadius: 'var(--radius-pill)',
            transition: 'width 600ms ease-out',
          }}
        />
      </div>
    </div>
  )
}
