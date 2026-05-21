import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '40px 32px',
        }}
      >
        {/* Logo / Brand */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Noded
          </h1>
          <p
            style={{
              marginTop: '4px',
              fontSize: '0.8rem',
              color: 'var(--color-accent)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Personal Hub
          </p>
        </div>

        <h2
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: subtitle ? '6px' : '24px',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-muted)',
              marginBottom: '24px',
            }}
          >
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}
