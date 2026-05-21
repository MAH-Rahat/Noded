import React from 'react'

interface ModuleCardProps {
  title: string
  children: React.ReactNode
  headerAction?: React.ReactNode
  badge?: React.ReactNode
  style?: React.CSSProperties
}

export function ModuleCard({ title, children, headerAction, badge, style }: ModuleCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {title}
          </h2>
          {badge}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* Card body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {children}
      </div>
    </div>
  )
}
