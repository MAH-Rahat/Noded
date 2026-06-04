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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: '3px' }}>
      {cells.map(({ date, completed }) => (
        <div
          key={date}
          title={date}
          style={{
            aspectRatio: '1',
            borderRadius: '3px',
            backgroundColor: completed ? 'var(--color-accent)' : 'rgba(255,255,255,0.06)',
            boxShadow: completed ? '0 0 4px var(--color-accent-glow)' : 'none',
            transition: 'background-color 200ms',
          }}
        />
      ))}
    </div>
  )
}
