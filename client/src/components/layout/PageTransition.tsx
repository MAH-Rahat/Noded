import React from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="page-enter" style={{ flex: 1 }}>
      {children}
    </div>
  )
}
