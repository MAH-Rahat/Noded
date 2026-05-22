import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--color-bg)',
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 90%, rgba(139,92,246,0.08) 0%, transparent 50%)
      `,
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 32px rgba(59,130,246,0.4)',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>N</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Noded</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>Personal Hub</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(13, 16, 23, 0.7)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: subtitle ? '6px' : '24px', letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
