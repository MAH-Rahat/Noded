import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { SearchIcon, SettingsIcon, LogOutIcon, WifiOffIcon } from '../ui/Icons'
import api from '../../lib/api'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const openSearch = useUIStore((s) => s.openSearch)
  const isOffline = useUIStore((s) => s.isOffline)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    try { await api.post('/api/v1/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-topbar)' as any,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      background: 'rgba(8, 10, 15, 0.8)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Logo mark */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(59,130,246,0.4)',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '-0.02em' }}>N</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            Noded
          </span>
        </Link>

        {title && (
          <>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>/</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{title}</span>
          </>
        )}

        {isOffline && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.7rem', color: 'var(--color-text-muted)',
            background: 'rgba(255,255,255,0.05)',
            padding: '3px 8px', borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <WifiOffIcon size={11} />
            Offline
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <IconBtn onClick={openSearch} label="Search"><SearchIcon /></IconBtn>
        <Link to="/settings" style={iconBtnStyle} aria-label="Settings"><SettingsIcon /></Link>
        <IconBtn onClick={handleLogout} label="Logout"><LogOutIcon /></IconBtn>
      </div>
    </header>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--color-text-muted)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  padding: '8px', borderRadius: '10px',
  transition: 'color 150ms, background 150ms',
  textDecoration: 'none',
}

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} style={iconBtnStyle}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none' }}
    >
      {children}
    </button>
  )
}
