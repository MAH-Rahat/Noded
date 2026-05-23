import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { RadialProgressRing } from '../components/charts/RadialProgressRing'
import { HeatmapCalendar } from '../components/tasks/HeatmapCalendar'
import { useTaskStateMachine } from '../hooks/useTaskStateMachine'
import { PlusIcon, TrashIcon, ClockIcon, FlameIcon } from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_TASKS, MOCK_HISTORY } from '../lib/mockData'
import api from '../lib/api'

export default function TasksPage() {
  const qc = useQueryClient()
  const { toggle } = useTaskStateMachine()
  const [newTitle, setNewTitle] = useState('')
  const today = new Date().toISOString().split('T')[0]

  // Local state for preview mode tasks (so toggle/add/delete work without a backend)
  const [previewTasks, setPreviewTasks] = useState(MOCK_TASKS.map(t => ({ ...t })))

  const { data: serverTasks = [] } = useQuery<any[]>({
    queryKey: ['tasks', today],
    queryFn: () => api.get(`/api/v1/tasks?date=${today}`).then(r => r.data.data),
    enabled: !IS_PREVIEW,
  })
  const { data: history = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['tasks', 'history'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_HISTORY) : api.get('/api/v1/tasks/history').then(r => r.data.data),
  })

  const tasks: any[] = IS_PREVIEW ? previewTasks : serverTasks

  // ── Mutations (real backend) ──────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: string }) =>
      api.patch(`/api/v1/tasks/${id}`, { state }),
    onMutate: async ({ id, state }) => {
      await qc.cancelQueries({ queryKey: ['tasks', today] })
      const prev = qc.getQueryData<any[]>(['tasks', today])
      qc.setQueryData<any[]>(['tasks', today], old =>
        (old || []).map(t => t.id === id ? { ...t, state } : t))
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', today], ctx.prev)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', today] }),
  })

  const createMutation = useMutation({
    mutationFn: (title: string) => api.post('/api/v1/tasks', { title, date: today }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', today] })
      setNewTitle('')
    },
  })

  // ── Preview handlers ──────────────────────────────────────────────────────
  function previewToggle(id: string) {
    setPreviewTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      return { ...t, state: toggle(t.state as any) }
    }))
  }

  function previewDelete(id: string) {
    setPreviewTasks(prev => prev.filter(t => t.id !== id))
  }

  function previewCreate(title: string) {
    const newTask = {
      id: `preview-${Date.now()}`,
      title,
      state: 'pending',
      sort_order: previewTasks.length,
      date: today,
      due_time: null,
    }
    setPreviewTasks(prev => [...prev, newTask])
    setNewTitle('')
  }

  // ── Unified handlers ──────────────────────────────────────────────────────
  function handleToggle(id: string, currentState: string) {
    if (IS_PREVIEW) {
      previewToggle(id)
    } else {
      toggleMutation.mutate({ id, state: toggle(currentState as any) })
    }
  }

  function handleDelete(id: string) {
    if (IS_PREVIEW) {
      previewDelete(id)
    } else {
      deleteMutation.mutate(id)
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    if (IS_PREVIEW) {
      previewCreate(newTitle.trim())
    } else {
      createMutation.mutate(newTitle.trim())
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const completed = tasks.filter(t => t.state === 'completed').length
  const total = tasks.length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  const streak = (() => {
    let count = 0; const d = new Date()
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split('T')[0]
      if ((history as any)[key]) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  })()

  const pending = tasks.filter(t => t.state === 'pending')
  const delayed = tasks.filter(t => t.state === 'delayed')
  const done = tasks.filter(t => t.state === 'completed')

  return (
    <PageLayout title="Routine & Relay">
      {/* Progress hero */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'var(--color-accent-glow)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <RadialProgressRing percent={percent} size={88} strokeWidth={7} label={`${completed}/${total}`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{percent}%</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: '12px' }}>
              {completed} of {total} tasks completed today
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-glow))', borderRadius: '2px', transition: 'width 800ms ease-out', boxShadow: '0 0 12px var(--color-accent-glow)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <FlameIcon size={20} style={{ color: streak > 0 ? '#F59E0B' : 'var(--color-text-muted)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: streak > 0 ? '#F59E0B' : 'var(--color-text-muted)' }}>{streak}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>streak</span>
          </div>
        </div>
      </div>

      {/* Add task */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Add a new task…"
          className="input-accent"
          style={{ flex: 1, padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none' }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '11px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}
        >
          <PlusIcon size={16} /> Add
        </button>
      </form>

      {/* Task sections */}
      {[
        { label: 'Pending',   items: pending, color: 'var(--color-accent)' },
        { label: 'Delayed',   items: delayed, color: '#F59E0B' },
        { label: 'Completed', items: done,    color: '#10B981' },
      ].filter(s => s.items.length > 0).map(({ label, items, color }) => (
        <div key={label} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label} ({items.length})</span>
          </div>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {items.map((t: any, i: number) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px',
                borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: t.state === 'completed' ? 'rgba(16,185,129,0.04)' : 'transparent',
                transition: 'background 150ms',
              }}>
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(t.id, t.state)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                    border: `1.5px solid ${t.state === 'completed' ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'}`,
                    background: t.state === 'completed' ? 'var(--color-accent)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 150ms',
                    boxShadow: t.state === 'completed' ? '0 0 8px var(--color-accent-glow)' : 'none',
                  }}
                >
                  {t.state === 'completed' && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l3 3 5-5" className="checkmark-path" />
                    </svg>
                  )}
                </button>

                <span style={{ flex: 1, fontSize: '0.875rem', color: t.state === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: t.state === 'completed' ? 'line-through' : 'none' }}>
                  {t.title}
                </span>

                {t.due_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    <ClockIcon size={11} />
                    {new Date(t.due_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {t.state === 'delayed' && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Late</span>
                )}

                <button
                  onClick={() => handleDelete(t.id)}
                  className="btn-danger-hover"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                >
                  <TrashIcon size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No tasks for today. Add one above.</div>
        </div>
      )}

      {/* Heatmap */}
      <div className="glass-card" style={{ padding: '20px', marginTop: '8px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>30-Day Completion History</div>
        <HeatmapCalendar history={history} />
      </div>
    </PageLayout>
  )
}