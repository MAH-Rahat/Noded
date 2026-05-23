import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, TrendingUpIcon, CheckSquareIcon, FileTextIcon, ShieldIcon } from '../ui/Icons'

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
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, Icon, label }) => {
        const isActive = location.pathname === to
        return (
          <NavLink key={to} to={to} className={`nav-item${isActive ? ' active' : ''}`}>
            <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />
            <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-head)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
