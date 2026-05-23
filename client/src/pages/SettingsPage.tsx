import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { usePokemonStore, POKEMON_TYPE_COLORS } from '../stores/pokemonStore'
import { IS_PREVIEW } from '../lib/mockData'
import api from '../lib/api'

const ACCENT_OPTIONS = [
  { label: 'Electric Blue',  value: '#3B82F6' },
  { label: 'Neon Green',     value: '#10B981' },
  { label: 'Violet Purple',  value: '#8B5CF6' },
  { label: 'Rose Red',       value: '#F43F5E' },
  { label: 'Amber',          value: '#F59E0B' },
  { label: 'Cyan',           value: '#06B6D4' },
]

const BG_OPTIONS = [
  { label: 'Deep Black', value: '#080A0F' },
  { label: 'Gunmetal',   value: '#0D1117' },
  { label: 'Midnight',   value: '#0A0E1A' },
]

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500,
      background: type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
      border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
      color: type === 'success' ? '#10B981' : '#F43F5E',
      marginBottom: '12px',
    }}>
      {type === 'success' ? '✓ ' : '✕ '}{message}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{title}</div>
      <div className="glass-card" style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-ui)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
}

export default function SettingsPage() {
  const { user, setAccentColor, setBackgroundColor } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const { type, level, pokemonName, spriteUrl } = usePokemonStore()
  const colors = POKEMON_TYPE_COLORS[type] ?? POKEMON_TYPE_COLORS.water

  const [displayName, setDisplayName] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [profileToast, setProfileToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwToast, setPwToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const profileMutation = useMutation({
    mutationFn: () => api.patch('/api/v1/settings/profile', { display_name: displayName, email }),
    onSuccess: () => { setProfileToast({ msg: 'Profile updated', type: 'success' }); setTimeout(() => setProfileToast(null), 3000) },
    onError: (e: any) => { setProfileToast({ msg: e?.response?.data?.detail ?? 'Failed to update', type: 'error' }); setTimeout(() => setProfileToast(null), 3000) },
  })

  const pwMutation = useMutation({
    mutationFn: () => api.patch('/api/v1/settings/password', { current_password: currentPw, new_password: newPw }),
    onSuccess: () => { setPwToast({ msg: 'Password updated', type: 'success' }); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setTimeout(() => setPwToast(null), 3000) },
    onError: (e: any) => { setPwToast({ msg: e?.response?.data?.detail ?? 'Failed to update password', type: 'error' }); setTimeout(() => setPwToast(null), 3000) },
  })

  function handleSaveProfile() {
    if (IS_PREVIEW) { setProfileToast({ msg: 'Preview mode — changes not saved', type: 'error' }); setTimeout(() => setProfileToast(null), 3000); return }
    profileMutation.mutate()
  }

  function handleUpdatePassword() {
    if (newPw !== confirmPw) { setPwToast({ msg: 'Passwords do not match', type: 'error' }); setTimeout(() => setPwToast(null), 3000); return }
    if (newPw.length < 8) { setPwToast({ msg: 'Password must be at least 8 characters', type: 'error' }); setTimeout(() => setPwToast(null), 3000); return }
    if (IS_PREVIEW) { setPwToast({ msg: 'Preview mode — changes not saved', type: 'error' }); setTimeout(() => setPwToast(null), 3000); return }
    pwMutation.mutate()
  }

  function handleAccent(color: string) {
    setAccentColor(color)
    if (!IS_PREVIEW) api.patch('/api/v1/settings/preferences', { accent_color: color }).catch(() => {})
  }

  function handleBg(color: string) {
    setBackgroundColor(color)
    document.documentElement.style.setProperty('--color-bg', color)
    if (!IS_PREVIEW) api.patch('/api/v1/settings/preferences', { background_color: color }).catch(() => {})
  }

  return (
    <PageLayout title="Settings">
      {/* Profile */}
      <Section title="Profile">
        {profileToast && <Toast message={profileToast.msg} type={profileToast.type} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
          <button onClick={handleSaveProfile} disabled={profileMutation.isPending}
            style={{ padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', opacity: profileMutation.isPending ? 0.6 : 1 }}>
            {profileMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Theme Mode">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Day/Night toggle with Pokémon vibe */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            style={{ flexShrink: 0 }}
            aria-label="Toggle theme"
          >
            <div className="theme-toggle-knob">
              {theme === 'dark' ? '🌙' : '☀️'}
            </div>
          </button>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '2px' }}>
              {theme === 'dark' ? '🌙 Night Mode' : '☀️ Day Mode'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {theme === 'dark'
                ? 'Dark glassmorphism — like a cave with Gengar'
                : 'Light mode — bright as a sunny Pallet Town'}
            </div>
          </div>
        </div>

        {/* Pokémon identity preview */}
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'var(--color-surface-2)', border: `1px solid ${colors.hex}30`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {spriteUrl && (
            <img src={spriteUrl} alt={pokemonName} style={{ width: '48px', height: '48px', objectFit: 'contain', imageRendering: 'pixelated', filter: `drop-shadow(0 0 8px ${colors.hex}80)` }} />
          )}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              You are <span style={{ color: colors.hex }}>{pokemonName}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              <span className="poke-type-badge" style={{ fontSize: '0.6rem', padding: '2px 7px' }}>{type}</span>
              {' '}· Level {level}
            </div>
          </div>
        </div>
      </Section>

      {/* Accent color */}
      <Section title="Accent Color">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {ACCENT_OPTIONS.map(({ label, value }) => (
            <button key={value} onClick={() => handleAccent(value)} title={label}
              className="scale-hover"
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: value, border: '3px solid transparent', cursor: 'pointer', boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>Changes apply instantly across the app</p>
      </Section>

      {/* Background */}
      <Section title="Background">
        <div style={{ display: 'flex', gap: '10px' }}>
          {BG_OPTIONS.map(({ label, value }) => (
            <button key={value} onClick={() => handleBg(value)} className="glow-hover"
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: value, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600 }}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section title="Security">
        {pwToast && <Toast message={pwToast.msg} type={pwToast.type} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Current Password', value: currentPw, setter: setCurrentPw },
            { label: 'New Password', value: newPw, setter: setNewPw },
            { label: 'Confirm Password', value: confirmPw, setter: setConfirmPw },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>{label}</label>
              <input type="password" placeholder="••••••••" value={value} onChange={e => setter(e.target.value)} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          ))}
          <button onClick={handleUpdatePassword} disabled={pwMutation.isPending}
            style={{ padding: '10px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#F43F5E', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', opacity: pwMutation.isPending ? 0.6 : 1 }}>
            {pwMutation.isPending ? 'Updating…' : 'Update Password'}
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
            { label: 'Mode', value: IS_PREVIEW ? 'Preview (no backend)' : 'Connected' },
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
