import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { SearchIcon, SettingsIcon, LogOutIcon, WifiOffIcon } from '../ui/Icons'
import api from '../../lib/api'

interface TopBarProps { title?: string }

export function TopBar({ title }: TopBarProps) {
  const openSearch = useUIStore((s) => s.openSearch)
  const isOffline = useUIStore((s) => s.isOffline)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email ? user.email.slice(0, 2).toUpperCase() : 'N'

  async function handleLogout() {
    try { await api.post('/api/v1/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px var(--color-accent-glow)',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>N</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Noded
          </span>
        </Link>

        {title && (
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>/ {title}</span>
        )}

        {isOffline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '999px', border: '1px solid var(--color-border)', flexShrink: 0 }}>
            <WifiOffIcon size={10} /> Offline
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <div className="theme-toggle-knob">
            {theme === 'dark' ? '🌙' : '☀️'}
          </div>
        </button>
        <button onClick={openSearch} className="icon-btn" aria-label="Search"><SearchIcon /></button>
        <Link to="/settings" className="icon-btn" aria-label="Settings"><SettingsIcon /></Link>
        <button onClick={handleLogout} className="icon-btn" aria-label="Logout"><LogOutIcon /></button>
      </div>
    </header>
  )
}
