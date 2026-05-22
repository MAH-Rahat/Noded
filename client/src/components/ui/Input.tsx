import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, style, onFocus, onBlur, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: '100%',
          padding: '11px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '10px',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color 150ms, box-shadow 150ms, background 150ms',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'rgba(255,255,255,0.1)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          onBlur?.(e)
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}
