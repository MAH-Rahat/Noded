import React from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    border: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: '#fff',
    border: 'none',
  },
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: 'var(--radius-input)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'opacity 150ms ease-out, transform 150ms ease-out',
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  )
}
