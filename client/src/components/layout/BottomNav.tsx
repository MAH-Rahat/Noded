import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', emoji: '⚡', label: 'Home' },
  { to: '/ledger',    emoji: '💰', label: 'Ledger' },
  { to: '/tasks',     emoji: '✅', label: 'Tasks' },
  { to: '/canvas',    emoji: '📝', label: 'Notes' },
  { to: '/vault',     emoji: '🔒', label: 'Vault' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 12px',
        borderRadius: '999px',
        // Glassmorphism
        background: 'rgba(26, 28, 35, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
      }}
    >
      {NAV_ITEMS.map(({ to, emoji, label }) => {
        const isActive = location.pathname === to
        return (
          <NavLink
            key={to}
            to={to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '8px 14px',
              borderRadius: '999px',
              textDecoration: 'none',
              transition: 'background 200ms, transform 150ms',
              background: isActive
                ? 'rgba(59,130,246,0.2)'
                : 'transparent',
              transform: isActive ? 'scale(1.08)' : 'scale(1)',
              border: isActive
                ? '1px solid rgba(59,130,246,0.35)'
                : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{emoji}</span>
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                textTransform: 'uppercase',
                transition: 'color 200ms',
              }}
            >
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
