import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useCountUp } from '../hooks/useCountUp'
import { usePokemonTheme } from '../hooks/usePokemonTheme'
import { RadialProgressRing } from '../components/charts/RadialProgressRing'
import { Sparkline } from '../components/charts/Sparkline'
import { usePokemonStore, POKEMON_TYPE_COLORS, getTierFromXP } from '../stores/pokemonStore'
import { useUIStore } from '../stores/uiStore'
import { TrendingUpIcon, CheckSquareIcon, FileTextIcon, ShieldIcon, ChevronRightIcon, FlameIcon, ClockIcon, PlusIcon } from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TASKS, MOCK_NOTES, MOCK_TRANSACTIONS, MOCK_HISTORY } from '../lib/mockData'
import api from '../lib/api'

const today = new Date()
const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
function getGreeting() { const h = today.getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening' }

function StatCard({ label, value, sub, to, Icon, sparkData }: { label: string; value: string; sub: string; to: string; Icon: React.ComponentType<any>; sparkData?: number[] }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className="glass-card hoverable" style={{ padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'hidden', height: '100%' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-accent-glow)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}><Icon size={17} strokeWidth={1.8} /></div>
          <ChevronRightIcon size={13} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '3px' }}>{value}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: sparkData ? '10px' : 0 }}>{sub}</div>
        {sparkData && sparkData.length > 1 && <div style={{ marginTop: '4px' }}><Sparkline data={sparkData} color="var(--color-accent)" height={28} /></div>}
      </div>
    </Link>
  )
}

function FinancePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, background: color + '0D', border: '1px solid ' + color + '20', borderRadius: '12px', padding: '12px 14px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color, marginBottom: '3px' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}

function TxRow({ tx }: { tx: any }) {
  const isIncome = tx.type === 'income'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: isIncome ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem' }}>{isIncome ? '+' : '-'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: isIncome ? 'var(--color-success)' : 'var(--color-danger)', flexShrink: 0 }}>{isIncome ? '+' : '-'}BDT {tx.amount.toLocaleString()}</div>
    </div>
  )
}

function SectionHeader({ title, linkTo, linkLabel = 'View all' }: { title: string; linkTo: string; linkLabel?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
      <Link to={linkTo} style={{ fontSize: '0.72rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>{linkLabel}</Link>
    </div>
  )
}

function PokemonCard() {
  const { type, pokemonName, description, spriteUrl, xp } = usePokemonStore()
  const colors = POKEMON_TYPE_COLORS[type] ?? POKEMON_TYPE_COLORS.water
  const tierInfo = getTierFromXP(xp ?? 0)
  const tierLabel = tierInfo.tierName === 'Master' ? 'Master' : `${tierInfo.tierName} ${tierInfo.division}`
  return (
    <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', position: 'relative', overflow: 'hidden', border: '1px solid ' + colors.hex + '30' }}>
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: colors.glow, filter: 'blur(50px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        <div style={{ flexShrink: 0, width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {spriteUrl ? <img src={spriteUrl} alt={pokemonName} className="poke-float" style={{ width: '80px', height: '80px', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 12px ' + colors.hex + '80)' }} />
            : <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: colors.dim, border: '2px solid ' + colors.hex + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚡</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>{pokemonName}</span>
            <span className="poke-type-badge" style={{ '--color-accent': colors.hex, '--color-accent-dim': colors.dim } as any}>{type}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: tierInfo.tierColor, background: tierInfo.tierColor + '20', padding: '2px 7px', borderRadius: '4px', border: `1px solid ${tierInfo.tierColor}40` }}>{tierLabel}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>{description}</div>
          {/* XP bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: tierInfo.tierColor, flexShrink: 0 }}>{tierInfo.xpInDivision} XP</span>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(tierInfo.xpInDivision / tierInfo.xpForNext) * 100}%`, background: `linear-gradient(90deg, ${tierInfo.tierColor}, ${colors.hex})`, borderRadius: '2px', transition: 'width 1s ease-out', boxShadow: `0 0 8px ${tierInfo.tierColor}80` }} />
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{tierInfo.xpForNext} XP</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>Total XP: {tierInfo.totalXP}</div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const qc = useQueryClient()
  const [quickTask, setQuickTask] = useState('')
  const { dashWidgets } = useUIStore()

  const { data: summary } = useQuery({ queryKey: ['ledger', 'summary'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_SUMMARY) : api.get('/api/v1/ledger/summary').then(r => r.data.data) })
  const { data: tasks = [] } = useQuery<any[]>({ queryKey: ['tasks', today.toISOString().split('T')[0]], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TASKS) : api.get('/api/v1/tasks').then(r => r.data.data) })
  const { data: notes = [] } = useQuery<any[]>({ queryKey: ['notes'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_NOTES) : api.get('/api/v1/notes').then(r => r.data.data) })
  const { data: txData } = useQuery<any>({ queryKey: ['transactions'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TRANSACTIONS) : api.get('/api/v1/ledger/transactions').then(r => r.data.data) })
  const { data: history = {} } = useQuery<Record<string, boolean>>({ queryKey: ['tasks', 'history'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_HISTORY) : api.get('/api/v1/tasks/history').then(r => r.data.data) })

  const addTaskMutation = useMutation({ mutationFn: (title: string) => api.post('/api/v1/tasks', { title, date: today.toISOString().split('T')[0] }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setQuickTask('') } })

  const completedToday = tasks.filter((t: any) => t.state === 'completed').length
  const totalToday = tasks.length
  const taskPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const balance = useCountUp(summary ? Number(summary.total_balance) : 0)
  const savingsRate = summary && summary.total_income > 0 ? Math.round(((summary.total_income - summary.total_expenses) / summary.total_income) * 100) : 20
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthData = summary?.monthly?.find((m: any) => m.month === currentMonth)
  const burnOk = monthData ? Number(monthData.expenses) <= Number(monthData.income) : true

  const streak = useMemo(() => {
    let count = 0; const d = new Date()
    for (let i = 0; i < 30; i++) { const key = d.toISOString().split('T')[0]; if ((history as any)[key]) { count++; d.setDate(d.getDate() - 1) } else break }
    return count
  }, [history])

  usePokemonTheme({ taskPct, savingsRate, streak, completedToday, totalToday, expenseOnBudget: burnOk })

  const balanceSparkData = useMemo(() => summary?.monthly?.map((m: any) => m.income - m.expenses) ?? [], [summary])
  const expenseSparkData = useMemo(() => summary?.monthly?.map((m: any) => m.expenses) ?? [], [summary])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = d.toISOString().split('T')[0]; return { key, label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1), done: !!(history as any)[key] } }), [history])
  const transactions = txData?.items ?? []

  function handleQuickAdd(e: React.FormEvent) { e.preventDefault(); if (!quickTask.trim()) return; if (IS_PREVIEW) { setQuickTask(''); return }; addTaskMutation.mutate(quickTask.trim()) }

  return (
    <PageLayout>
      <div style={{ marginBottom: '20px', paddingTop: '4px' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{dateStr}</p>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{getGreeting()}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '5px' }}>Your trainer stats are looking {taskPct >= 75 ? 'legendary' : taskPct >= 50 ? 'solid' : 'like they need a grind'}</p>
      </div>

      {dashWidgets.pokemon && <PokemonCard />}

      {dashWidgets.stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <StatCard label="Net Balance" value={'BDT ' + balance.toLocaleString()} sub="All time" to="/ledger" Icon={TrendingUpIcon} sparkData={balanceSparkData} />
          <StatCard label="Tasks Today" value={completedToday + '/' + totalToday} sub={taskPct + '% complete'} to="/tasks" Icon={CheckSquareIcon} />
          <StatCard label="Notes" value={String(notes.length)} sub="Total saved" to="/canvas" Icon={FileTextIcon} />
          <StatCard label="Vault" value="Secured" sub="Tap to unlock" to="/vault" Icon={ShieldIcon} />
        </div>
      )}

      {dashWidgets.finance && summary && (
        <div style={{ marginBottom: '24px' }}>
          <SectionHeader title="Finance Overview" linkTo="/ledger" />
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <FinancePill label="Income" value={'BDT ' + (summary.total_income / 1000).toFixed(0) + 'k'} color="#10B981" />
              <FinancePill label="Expenses" value={'BDT ' + (summary.total_expenses / 1000).toFixed(0) + 'k'} color="#F43F5E" />
              <FinancePill label="Savings" value={savingsRate + '%'} color="var(--color-accent)" />
            </div>
            {expenseSparkData.length > 1 && <div><div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly spend trend</div><Sparkline data={expenseSparkData} color="#F43F5E" height={36} /></div>}
          </div>
        </div>
      )}

      {dashWidgets.tasks && tasks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionHeader title="Today's Tasks" linkTo="/tasks" />
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 16px 12px' }}>
              <RadialProgressRing percent={taskPct} size={72} strokeWidth={6} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{completedToday} of {totalToday} tasks done</div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}><div style={{ height: '100%', width: taskPct + '%', background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-glow))', borderRadius: '2px', transition: 'width 800ms ease-out' }} /></div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>{taskPct === 100 ? 'All tasks complete!' : (totalToday - completedToday) + ' remaining'}</div>
              </div>
              {streak > 0 && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FlameIcon size={14} style={{ color: 'var(--color-warning)' }} /><span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-warning)' }}>{streak}</span></div><span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>streak</span></div>}
            </div>
            {tasks.slice(0, 4).map((t: any) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, border: '1.5px solid ' + (t.state === 'completed' ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)'), background: t.state === 'completed' ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.state === 'completed' && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>}
                </div>
                <span style={{ fontSize: '0.85rem', color: t.state === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: t.state === 'completed' ? 'line-through' : 'none', flex: 1 }}>{t.title}</span>
                {t.due_time && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}><ClockIcon size={11} />{new Date(t.due_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                {t.state === 'delayed' && <span style={{ fontSize: '0.62rem', color: 'var(--color-warning)', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>DELAYED</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {dashWidgets.transactions && transactions.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionHeader title="Recent Transactions" linkTo="/ledger" />
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {transactions.slice(0, 4).map((tx: any) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        </div>
      )}

      {dashWidgets.notes && notes.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionHeader title="Recent Notes" linkTo="/canvas" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notes.slice(0, 2).map((n: any) => (
              <Link key={n.id} to="/canvas" style={{ textDecoration: 'none' }}>
                <div className="glass-card slide-hover" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {n.tag_color && <div style={{ width: '3px', height: '32px', borderRadius: '2px', background: n.tag_color, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{n.title}</span>
                        {n.pinned && <span style={{ fontSize: '0.6rem', color: 'var(--color-warning)', background: 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>PINNED</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body.replace(/[#*`]/g, '').slice(0, 70)}</div>
                    </div>
                    <ChevronRightIcon size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {dashWidgets.weekly && (
        <div style={{ marginBottom: '24px' }}>
          <SectionHeader title="This Week" linkTo="/tasks" linkLabel="Full history" />
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {weekDays.map(({ key, label, done }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: done ? 'var(--color-accent-dim)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (done ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}>
                    {done ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />}
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                </div>
              ))}
            </div>
            {streak > 0 && <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}><FlameIcon size={13} style={{ color: 'var(--color-warning)' }} /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}><span style={{ color: 'var(--color-warning)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{streak}</span>-day streak</span></div>}
          </div>
        </div>
      )}

      {dashWidgets.quickAdd && (
        <div style={{ marginBottom: '8px' }}>
          <SectionHeader title="Quick Add Task" linkTo="/tasks" linkLabel="All tasks" />
          <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '8px' }}>
            <input value={quickTask} onChange={e => setQuickTask(e.target.value)} placeholder="Add a task for today..." className="input-field" style={{ flex: 1 }} />
            <button type="submit" disabled={!quickTask.trim()} className="btn-primary" style={{ padding: '11px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}><PlusIcon size={15} /> Add</button>
          </form>
        </div>
      )}
    </PageLayout>
  )
}
