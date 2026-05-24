import React from 'react'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { SearchOverlay } from '../overlays/SearchOverlay'

interface PageLayoutProps {
  title?: string
  children: React.ReactNode
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh' as any, backgroundColor: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title={title} />
      <SearchOverlay />
      <main
        className="page-enter"
        style={{
          flex: 1,
          padding: '16px 16px 96px',
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
