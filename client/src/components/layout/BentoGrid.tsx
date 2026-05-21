import React from 'react'

interface BentoGridProps {
  children: React.ReactNode
}

export function BentoGrid({ children }: BentoGridProps) {
  return (
    <main
      style={{
        paddingTop: '48px', // offset for fixed GlobalStatsBar
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',          // mobile: single column
          gap: '12px',
          padding: '12px',
          // Tablet (768px+): 2 columns
          // Desktop (1200px+): 4 columns
          // Applied via inline style + CSS media queries via className
        }}
        className="bento-grid"
      >
        {children}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .bento-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
            padding: 16px !important;
          }
        }
        @media (min-width: 1200px) {
          .bento-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 20px !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </main>
  )
}
