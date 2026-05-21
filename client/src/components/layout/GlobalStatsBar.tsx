import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { Skeleton } from '../ui/Skeleton'
import api from '../../lib/api'

interface StatsBarProps {
  notesCount?: number
  tasksDoneToday?: number
  balance?: string
  loading?: boolean
}

export function GlobalStatsBar({ notesCount, tasksDoneToday, balance, loading }: StatsBarProps) {
  const openSearch = useUIStore((s) => s.openSearch)
  const isOffline = useUIStore((s) => s.isOffline)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await api.post('/api/v1/auth/logout')
    } catch {
      // ignore — clear client side regardless
    }
    logout()
    navigate('/login', { replace: true })
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 'var(--z-stats-bar)',
        gap: '12px',
      }}
    >
      {/* Left: brand + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-accent)', letterSpacing: '-0.01em' }}>
          Noded
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{today}</span>
        {isOffline && (
          <span
            className="pulse"
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-2)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-text-muted)', display: 'inline-block' }} />
            Offline
          </span>
        )}
      </div>

      {/* Center: stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden' }}>
        {loading ? (
          <>
            <Skeleton width="60px" height="12px" />
            <Skeleton width="60px" height="12px" />
            <Skeleton width="70px" height="12px" />
          </>
        ) : (
          <>
            <span><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{notesCount ?? 0}</span> notes</span>
            <span><span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{tasksDoneToday ?? 0}</span> done today</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', fontWeight: 600 }}>{balance ?? '—'}</span>
          </>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Search */}
        <button
          onClick={openSearch}
          aria-label="Search"
          style={iconBtnStyle}
        >
          <SearchIcon />
        </button>

        {/* Settings */}
        <Link to="/settings" aria-label="Settings" style={iconBtnStyle}>
          <GearIcon />
        </Link>

        {/* Logout */}
        <button onClick={handleLogout} aria-label="Logout" style={iconBtnStyle}>
          <LogoutIcon />
        </button>
      </div>
    </header>
  )
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  borderRadius: '6px',
  transition: 'color 150ms',
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
