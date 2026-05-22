import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useCountUp } from '../hooks/useCountUp'
import {
  TrendingUpIcon, CheckSquareIcon, FileTextIcon, ShieldIcon, ChevronRightIcon,
} from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TASKS, MOCK_NOTES } from '../lib/mockData'
import api from '../lib/api'

const today = new Date()
const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

function getGreeting() {
  const h = today.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface StatCardProps {
  label: string
  value: string
  sub: string
  to: string
  Icon: React.ComponentType<any>
  accentColor: string
  glowColor: string
}

function StatCard({ label, value, sub, to, Icon, accentColor, glowColor }: StatCardProps) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div
        className="glass-card"
        style={{ padding: '20px', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 200ms, box-shadow 200ms' }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}30`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = ''
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: glowColor, filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accentColor,
          }}>
            <Icon size={18} strokeWidth={1.8} />
          </div>
          <ChevronRightIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          {value}
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{sub}</div>
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
    queryKey: ['tasks', today.toISOString().split('T')[0]],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TASKS) : api.get('/api/v1/tasks').then(r => r.data.data),
  })
  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ['notes'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_NOTES) : api.get('/api/v1/notes').then(r => r.data.data),
  })

  const balance = useCountUp(summary ? Number(summary.total_balance) : 0)
  const completedToday = tasks.filter((t: any) => t.state === 'completed').length
  const totalToday = tasks.length
  const taskPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0

  return (
    <PageLayout>
      {/* Hero greeting */}
      <div style={{ marginBottom: '28px', paddingTop: '4px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {dateStr}
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          {getGreeting()}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Here's your command center overview
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
        <StatCard
          label="Net Balance" value={`৳${balance.toLocaleString()}`} sub="All time"
          to="/ledger" Icon={TrendingUpIcon}
          accentColor="#3B82F6" glowColor="rgba(59,130,246,0.15)"
        />
        <StatCard
          label="Tasks Today" value={`${completedToday}/${totalToday}`} sub={`${taskPct}% complete`}
          to="/tasks" Icon={CheckSquareIcon}
          accentColor="#10B981" glowColor="rgba(16,185,129,0.12)"
        />
        <StatCard
          label="Notes" value={String(notes.length)} sub="Total saved"
          to="/canvas" Icon={FileTextIcon}
          accentColor="#8B5CF6" glowColor="rgba(139,92,246,0.12)"
        />
        <StatCard
          label="Vault" value="Secured" sub="Tap to unlock"
          to="/vault" Icon={ShieldIcon}
          accentColor="#F59E0B" glowColor="rgba(245,158,11,0.12)"
        />
      </div>

      {/* Today's tasks preview */}
      {tasks.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Tasks</span>
            <Link to="/tasks" style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          <div className="glass-card" style={{ padding: '4px 0', overflow: 'hidden' }}>
            {/* Progress bar */}
            <div style={{ padding: '12px 16px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{completedToday} of {totalToday} done</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>{taskPct}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${taskPct}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', borderRadius: '2px', transition: 'width 800ms ease-out' }} />
              </div>
            </div>
            {tasks.slice(0, 3).map((t: any, i: number) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 16px',
                borderTop: i === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                  border: `1.5px solid ${t.state === 'completed' ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)'}`,
                  background: t.state === 'completed' ? 'var(--color-accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.state === 'completed' && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: '0.875rem', color: t.state === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  textDecoration: t.state === 'completed' ? 'line-through' : 'none', flex: 1,
                }}>
                  {t.title}
                </span>
                {t.state === 'delayed' && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-warning)', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    DELAYED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent notes preview */}
      {notes.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Notes</span>
            <Link to="/canvas" style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.slice(0, 2).map((n: any) => (
              <Link key={n.id} to="/canvas" style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{ padding: '14px 16px', transition: 'transform 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {n.tag_color && <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: n.tag_color, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '3px' }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.body.replace(/[#*`]/g, '').slice(0, 60)}
                      </div>
                    </div>
                    <ChevronRightIcon size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
