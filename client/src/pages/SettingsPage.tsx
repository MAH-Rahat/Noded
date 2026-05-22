import React, { useState } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { useAuthStore } from '../stores/authStore'

const ACCENT_OPTIONS = [
  { label: 'Electric Blue', value: '#3B82F6', glow: 'rgba(59,130,246,0.4)' },
  { label: 'Neon Green',    value: '#10B981', glow: 'rgba(16,185,129,0.4)' },
  { label: 'Violet Purple', value: '#8B5CF6', glow: 'rgba(139,92,246,0.4)' },
  { label: 'Rose Red',      value: '#F43F5E', glow: 'rgba(244,63,94,0.4)' },
  { label: 'Amber',         value: '#F59E0B', glow: 'rgba(245,158,11,0.4)' },
]

const BG_OPTIONS = [
  { label: 'Deep Black', value: '#080A0F' },
  { label: 'Gunmetal',   value: '#0D1117' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{title}</div>
      <div className="glass-card" style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, setAccentColor, setBackgroundColor } = useAuthStore()
  const [currentAccent, setCurrentAccent] = useState('var(--color-accent)')

  function handleAccent(color: string) {
    setAccentColor(color)
    setCurrentAccent(color)
  }

  function handleBg(color: string) {
    setBackgroundColor(color)
    document.documentElement.style.setProperty('--color-bg', color)
  }

  return (
    <PageLayout title="Settings">
      {/* Profile */}
      <Section title="Profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Display Name', placeholder: user?.username || 'Your name', type: 'text' },
            { label: 'Email', placeholder: user?.email || 'your@email.com', type: 'email' },
          ].map(({ label, placeholder, type }) => (
            <div key={label}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>{label}</label>
              <input type={type} placeholder={placeholder}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as any }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          ))}
          <button style={{ padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            Save Changes
          </button>
        </div>
      </Section>

      {/* Accent color */}
      <Section title="Accent Color">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {ACCENT_OPTIONS.map(({ label, value, glow }) => (
            <button key={value} onClick={() => handleAccent(value)} title={label}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: value, border: '3px solid', borderColor: 'transparent', cursor: 'pointer', transition: 'all 200ms', boxShadow: `0 0 0 2px rgba(255,255,255,0.1)` }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 16px ${glow}, 0 0 0 2px ${value}` }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>Changes apply instantly across the app</p>
      </Section>

      {/* Background */}
      <Section title="Background">
        <div style={{ display: 'flex', gap: '10px' }}>
          {BG_OPTIONS.map(({ label, value }) => (
            <button key={value} onClick={() => handleBg(value)}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: value, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600, transition: 'border-color 150ms' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section title="Security">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Current Password', 'New Password', 'Confirm Password'].map(label => (
            <div key={label}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>{label}</label>
              <input type="password" placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as any }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          ))}
          <button style={{ padding: '10px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#F43F5E', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            Update Password
          </button>
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'App', value: 'Noded Personal Hub' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Stack', value: 'FastAPI + React + PostgreSQL' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </Section>
    </PageLayout>
  )
}
