import React from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', loading = false, disabled, children, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.05)',
      color: 'var(--color-text-secondary)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    danger: {
      background: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 16px rgba(244,63,94,0.25)',
    },
    subtle: {
      background: 'rgba(59,130,246,0.1)',
      color: 'var(--color-accent)',
      border: '1px solid rgba(59,130,246,0.2)',
    },
  }

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '11px 20px',
        borderRadius: '10px',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'opacity 150ms, transform 150ms, box-shadow 150ms',
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      {...props}
    >
      {loading && (
        <span style={{
          width: '14px', height: '14px',
          border: '2px solid currentColor', borderTopColor: 'transparent',
          borderRadius: '50%', display: 'inline-block',
          animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {children}
    </button>
  )
}
