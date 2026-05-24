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
    <div style={{
      minHeight: '100dvh',
      backgroundColor: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      overflowX: 'hidden',
    }}>
      <TopBar title={title} />
      <SearchOverlay />
      <main
        className="page-enter"
        style={{
          flex: 1,
          padding: '12px 12px 96px',
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          minWidth: 0,
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
