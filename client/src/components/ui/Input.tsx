import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, style, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: '100%',
          padding: '10px 14px',
          backgroundColor: 'var(--color-surface)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-input)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.95rem',
          outline: 'none',
          transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent)'
          e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--color-accent) 20%, transparent)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{error}</span>
      )}
    </div>
  )
}
