import React from 'react'
import { GlobalStatsBar } from './GlobalStatsBar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
  statsProps?: {
    notesCount?: number
    tasksDoneToday?: number
    balance?: string
    loading?: boolean
  }
}

export function AppShell({ children, statsProps }: AppShellProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <GlobalStatsBar
        loading={statsProps?.loading}
        notesCount={statsProps?.notesCount}
        tasksDoneToday={statsProps?.tasksDoneToday}
        balance={statsProps?.balance}
      />
      {/* Content area — padded for top bar (48px) and bottom nav (64px) */}
      <main
        style={{
          flex: 1,
          paddingTop: '48px',
          paddingBottom: '64px',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
