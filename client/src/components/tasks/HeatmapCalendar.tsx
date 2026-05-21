import React from 'react'

interface HeatmapCalendarProps {
  history: Record<string, boolean>  // date string -> all completed
  days?: number
}

export function HeatmapCalendar({ history, days = 30 }: HeatmapCalendarProps) {
  const cells: { date: string; completed: boolean }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    cells.push({ date: key, completed: !!history[key] })
  }

  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
        Last {days} days
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '3px',
        }}
      >
        {cells.map(({ date, completed }) => (
          <div
            key={date}
            title={date}
            style={{
              aspectRatio: '1',
              borderRadius: '3px',
              backgroundColor: completed
                ? 'var(--color-accent)'
                : 'var(--color-border)',
              opacity: completed ? 1 : 0.4,
              transition: 'background-color 200ms',
            }}
          />
        ))}
      </div>
    </div>
  )
}
