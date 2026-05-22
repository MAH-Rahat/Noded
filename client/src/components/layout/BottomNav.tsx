import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon, TrendingUpIcon, CheckSquareIcon, FileTextIcon, ShieldIcon,
} from '../ui/Icons'

const NAV_ITEMS = [
  { to: '/dashboard', Icon: HomeIcon,        label: 'Home' },
  { to: '/ledger',    Icon: TrendingUpIcon,  label: 'Ledger' },
  { to: '/tasks',     Icon: CheckSquareIcon, label: 'Tasks' },
  { to: '/canvas',    Icon: FileTextIcon,    label: 'Notes' },
  { to: '/vault',     Icon: ShieldIcon,      label: 'Vault' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-nav)' as any,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '6px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(8, 10, 15, 0.85)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow:
          '0 20px 60px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255,255,255,0.06) inset',
      }}
    >
      {NAV_ITEMS.map(({ to, Icon, label }) => {
        const isActive = location.pathname === to
        return (
          <NavLink
            key={to}
            to={to}
            title={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '10px 16px',
              borderRadius: '999px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              background: isActive
                ? 'rgba(59, 130, 246, 0.15)'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(59, 130, 246, 0.25)'
                : '1px solid transparent',
              boxShadow: isActive
                ? '0 0 16px rgba(59, 130, 246, 0.2)'
                : 'none',
              transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.6} />
            <span style={{
              fontSize: '0.55rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: isActive ? 1 : 0.6,
            }}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
