import React from 'react'

interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
}

function DefaultIllustration() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="24" stroke="var(--color-border)" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="14" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="20" y1="32" x2="44" y2="32" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="20" x2="32" y2="44" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      {icon ?? <DefaultIllustration />}
      <p
        style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem',
          maxWidth: '200px',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
    </div>
  )
}
