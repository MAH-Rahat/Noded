import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useCountUp } from '../hooks/useCountUp'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TASKS, MOCK_NOTES } from '../lib/mockData'
import api from '../lib/api'

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

function StatCard({ emoji, label, value, sub, to, color }: {
  emoji: string; label: string; value: string; sub?: string; to: string; color?: string
}) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'rgba(26,28,35,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'border-color 200ms, transform 150ms',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color ?? 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{value}</div>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{sub}</div>}
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ['ledger', 'summary'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_SUMMARY) : api.get('/api/v1/ledger/summary').then(r => r.data.data),
  })
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks', new Date().toISOString().split('T')[0]],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TASKS) : api.get('/api/v1/tasks').then(r => r.data.data),
  })
  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ['notes'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_NOTES) : api.get('/api/v1/notes').then(r => r.data.data),
  })

  const balance = useCountUp(summary ? Number(summary.total_balance) : 0)
  const completedToday = tasks.filter((t: any) => t.state === 'completed').length
  const totalToday = tasks.length

  return (
    <PageLayout>
      {/* Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
          Good {getGreeting()} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>{today}</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <StatCard emoji="💰" label="Balance" value={`৳${balance.toLocaleString()}`} sub="All time" to="/ledger" color="var(--color-accent)" />
        <StatCard emoji="✅" label="Tasks" value={`${completedToday}/${totalToday}`} sub="Done today" to="/tasks" color="var(--color-success)" />
        <StatCard emoji="📝" label="Notes" value={String(notes.length)} sub="Total notes" to="/canvas" />
        <StatCard emoji="🔒" label="Vault" value="Locked" sub="Tap to unlock" to="/vault" color="var(--color-text-muted)" />
      </div>

      {/* Quick links */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Quick Access
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { to: '/ledger', emoji: '💰', label: 'The Ledger', desc: 'Track income & expenses' },
            { to: '/tasks', emoji: '✅', label: 'Routine & Relay', desc: 'Daily tasks & habits' },
            { to: '/canvas', emoji: '📝', label: 'The Canvas', desc: 'Markdown notes' },
            { to: '/vault', emoji: '🔒', label: 'The Vault', desc: 'Encrypted secrets' },
          ].map(({ to, emoji, label, desc }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px',
                background: 'rgba(26,28,35,0.5)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                transition: 'border-color 150ms',
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{desc}</div>
                </div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
