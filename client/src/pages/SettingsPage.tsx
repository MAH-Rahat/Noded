import React, { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useAuthStore } from '../stores/authStore'
import { useUIStore, FONT_MAP, type FontChoice } from '../stores/uiStore'
import { usePokemonStore, POKEMON_TYPE_COLORS } from '../stores/pokemonStore'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TASKS, MOCK_HISTORY } from '../lib/mockData'
import api from '../lib/api'

const ACCENT_OPTIONS = [
  { label: 'Electric Blue',  value: '#3B82F6' },
  { label: 'Neon Green',     value: '#10B981' },
  { label: 'Violet Purple',  value: '#8B5CF6' },
  { label: 'Rose Red',       value: '#F43F5E' },
  { label: 'Amber',          value: '#F59E0B' },
  { label: 'Cyan',           value: '#06B6D4' },
  { label: 'Pink',           value: '#EC4899' },
  { label: 'Lime',           value: '#84CC16' },
  { label: 'Orange',         value: '#F97316' },
  { label: 'Indigo',         value: '#6366F1' },
  // Custom color — user can pick any hex
]
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
  const { theme, toggleTheme, font, setFont, dashWidgets, toggleWidget } = useUIStore()
  const { type, level, pokemonName, spriteUrl } = usePokemonStore()
  const colors = POKEMON_TYPE_COLORS[type] ?? POKEMON_TYPE_COLORS.water

  // Live stats for the Pokemon card
  const today = new Date().toISOString().split('T')[0]
  const { data: summary } = useQuery({ queryKey: ['ledger', 'summary'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_SUMMARY) : api.get('/api/v1/ledger/summary').then(r => r.data.data) })
  const { data: tasks = [] } = useQuery<any[]>({ queryKey: ['tasks', today], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TASKS) : api.get(`/api/v1/tasks?date=${today}`).then(r => r.data.data) })
  const { data: history = {} } = useQuery<Record<string, boolean>>({ queryKey: ['tasks', 'history'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_HISTORY) : api.get('/api/v1/tasks/history').then(r => r.data.data) })

  const completedToday = tasks.filter((t: any) => t.state === 'completed').length
  const totalToday = tasks.length
  const taskPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const savingsRate = summary && summary.total_income > 0
    ? Math.round(((summary.total_income - summary.total_expenses) / summary.total_income) * 100)
    : 0
  const streak = useMemo(() => {
    let count = 0; const d = new Date()
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split('T')[0]
      if ((history as any)[key]) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  }, [history])

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
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'var(--color-surface-2)', border: `1px solid ${colors.hex}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            {spriteUrl && (
              <img src={spriteUrl} alt={pokemonName} style={{ width: '64px', height: '64px', objectFit: 'contain', imageRendering: 'pixelated', filter: `drop-shadow(0 0 8px ${colors.hex}80)` }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                You are <span style={{ color: colors.hex }}>{pokemonName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span className="poke-type-badge" style={{ fontSize: '0.6rem', padding: '2px 7px' }}>{type}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>· Level {level}</span>
              </div>
              {/* Level bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div className="level-bar-fill" style={{ width: `${level}%` }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{level}/100</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { label: '🔥 Streak', value: `${streak} days`, color: streak > 0 ? '#F59E0B' : 'var(--color-text-muted)' },
              { label: '✅ Today', value: `${completedToday}/${totalToday}`, color: taskPct === 100 ? '#10B981' : 'var(--color-text-primary)' },
              { label: '💰 Savings', value: `${savingsRate}%`, color: savingsRate >= 30 ? '#10B981' : savingsRate >= 10 ? colors.hex : '#F43F5E' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '8px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color, marginBottom: '2px' }}>{value}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Accent color */}
      <Section title="Accent Color">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {ACCENT_OPTIONS.map(({ label, value }) => (
            <button key={value} onClick={() => handleAccent(value)} title={label}
              className="scale-hover"
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: value, border: '3px solid transparent', cursor: 'pointer', boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' }}
            />
          ))}
          {/* Custom color picker */}
          <label title="Custom color" style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', border: '3px solid transparent', boxShadow: '0 0 0 2px rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🎨</div>
            <input type="color" onChange={e => handleAccent(e.target.value)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
          </label>
        </div>
        {/* Default (Pokemon) button */}
        <button onClick={() => {
          const pokemonColor = colors.hex
          handleAccent(pokemonColor)
        }} style={{ marginTop: '10px', padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: `1px solid ${colors.hex}`, background: colors.dim, color: colors.hex, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {spriteUrl && <img src={spriteUrl} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', imageRendering: 'pixelated' }} />}
          Use Pokémon Default ({pokemonName})
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>Changes apply instantly across the whole app</p>
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

      {/* Font */}
      <Section title="Font">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(Object.keys(FONT_MAP) as FontChoice[]).map(f => (
            <button key={f} onClick={() => setFont(f)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid', borderColor: font === f ? 'var(--color-accent)' : 'var(--color-border)', background: font === f ? 'var(--color-accent-dim)' : 'transparent', color: font === f ? 'var(--color-accent)' : 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: FONT_MAP[f], fontSize: '0.9rem', textAlign: 'left', transition: 'all 150ms' }}>
              {f === 'dm-sans' ? 'DM Sans' : f === 'outfit' ? 'Outfit' : f === 'inter' ? 'Inter' : f === 'space-grotesk' ? 'Space Grotesk' : 'Sora'} — The quick brown fox
            </button>
          ))}
        </div>
      </Section>

      {/* Dashboard Widgets */}
      <Section title="Dashboard Widgets">
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Toggle which sections appear on your dashboard</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {([
            { key: 'pokemon', label: 'Pokémon Identity Card' },
            { key: 'stats', label: 'Stat Cards (Balance, Tasks, Notes, Vault)' },
            { key: 'finance', label: 'Finance Overview' },
            { key: 'tasks', label: "Today's Tasks" },
            { key: 'transactions', label: 'Recent Transactions' },
            { key: 'notes', label: 'Recent Notes' },
            { key: 'weekly', label: 'Weekly Activity Strip' },
            { key: 'quickAdd', label: 'Quick Add Task' },
          ] as { key: keyof typeof dashWidgets; label: string }[]).map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{label}</span>
              <button onClick={() => toggleWidget(key)} style={{ width: '40px', height: '22px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: dashWidgets[key] ? 'var(--color-accent)' : 'var(--color-border)', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '3px', left: dashWidgets[key] ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 200ms' }} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* About */}
      <Section title="About">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
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

        {/* Pokémon Guide */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            {spriteUrl && <img src={spriteUrl} alt={pokemonName} style={{ width: '36px', height: '36px', objectFit: 'contain', imageRendering: 'pixelated', filter: `drop-shadow(0 0 6px ${colors.hex}80)` }} />}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Your Pokémon Guide</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>How the companion system works</div>
            </div>
          </div>

          {/* Live stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[
              { label: 'Current Pokémon', value: pokemonName, color: colors.hex },
              { label: 'Type', value: type.charAt(0).toUpperCase() + type.slice(1), color: colors.hex },
              { label: 'Level', value: `${level} / 100`, color: 'var(--color-text-primary)' },
              { label: 'Task Streak', value: `${streak} days 🔥`, color: streak > 0 ? '#F59E0B' : 'var(--color-text-muted)' },
              { label: 'Tasks Today', value: `${completedToday}/${totalToday} (${taskPct}%)`, color: taskPct === 100 ? '#10B981' : 'var(--color-text-primary)' },
              { label: 'Savings Rate', value: `${savingsRate}%`, color: savingsRate >= 30 ? '#10B981' : savingsRate >= 10 ? colors.hex : '#F43F5E' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '8px 10px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {[
            {
              icon: '🔄',
              title: 'How a new Pokémon arrives',
              body: 'Your Pokémon is determined by your savings rate. Spend less than you earn and your type shifts — from Fire (overspending) → Fighting → Grass → Water → Electric → Dragon → Psychic → Steel (fortress savings). Each type maps to an iconic Pokémon like Vaporeon (Water) or Jolteon (Electric).',
            },
            {
              icon: '⬆️',
              title: 'How to level up',
              body: 'Your level (1–100) is calculated from your task streak × 3 plus a bonus from your daily completion rate. Complete all your tasks every day to build a streak and watch your level climb. Level 100 means 33+ day streak with perfect task completion.',
            },
            {
              icon: '✨',
              title: 'How Pokémon evolve',
              body: 'Your Pokémon changes (evolves) when your financial type changes. Improve your savings rate to unlock stronger types. For example: save 30%+ of income → Water type (Vaporeon), save 40%+ → Electric (Jolteon), save 55%+ → Dragon (Dragonite), save 70%+ → Psychic (Alakazam).',
            },
            {
              icon: '📊',
              title: 'What drives your type',
              body: 'Add income and expense transactions in the Ledger. Your savings rate = (income − expenses) / income × 100. The higher your savings rate, the rarer and more powerful your Pokémon type becomes.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} style={{ marginBottom: '14px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </Section>
    </PageLayout>
  )
}
