import React from 'react'

interface StreakCounterProps {
  streak: number
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '1.1rem' }}>🔥</span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: streak > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
          }}
        >
          {streak}
        </span>
      </div>
      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        day streak
      </span>
    </div>
  )
}
