import React from 'react'

interface HeatmapCalendarProps {
  history: Record<string, boolean>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
        {cells.map(({ date, completed }) => (
          <div
            key={date}
            title={date}
            style={{
              aspectRatio: '1',
              borderRadius: '4px',
              backgroundColor: completed ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
              boxShadow: completed ? '0 0 6px rgba(59,130,246,0.4)' : 'none',
              transition: 'background-color 200ms',
            }}
          />
        ))}
      </div>
    </div>
  )
}
