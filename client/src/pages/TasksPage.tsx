import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function TasksPage() {
  const qc = useQueryClient()
  const { toggle } = useTaskStateMachine()
  const [newTitle, setNewTitle] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks', today],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TASKS) : api.get(`/api/v1/tasks?date=${today}`).then(r => r.data.data),
  })
  const { data: history = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['tasks', 'history'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_HISTORY) : api.get('/api/v1/tasks/history').then(r => r.data.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: string }) => api.patch(`/api/v1/tasks/${id}`, { state }),
    onMutate: async ({ id, state }) => {
      await qc.cancelQueries({ queryKey: ['tasks', today] })
      const prev = qc.getQueryData<any[]>(['tasks', today])
      qc.setQueryData<any[]>(['tasks', today], old => (old || []).map(t => t.id === id ? { ...t, state } : t))
      return { prev }
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['tasks', today], ctx.prev) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', today] }),
  })

  const createMutation = useMutation({
    mutationFn: (title: string) => api.post('/api/v1/tasks', { title, date: today }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', today] }); setNewTitle('') },
  })

  const completed = tasks.filter(t => t.state === 'completed').length
  const total = tasks.length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  const streak = (() => {
    let count = 0
    const d = new Date()
    while (true) {
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
      {/* Progress header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', background: 'rgba(26,28,35,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
        <RadialProgressRing percent={percent} size={90} label={`${completed}/${total}`} />
        <div style={{ flex: 1, padding: '0 20px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{percent}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>completed today</div>
          <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: 'var(--radius-pill)', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: 'var(--color-accent)', borderRadius: 'var(--radius-pill)', transition: 'width 600ms ease-out' }} />
          </div>
        </div>
        <StreakCounter streak={streak} />
      </div>

      {/* Add task */}
      <form onSubmit={e => { e.preventDefault(); if (newTitle.trim()) createMutation.mutate(newTitle.trim()) }} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Add a new task…" style={{ fontSize: '0.9rem' }} />
        <Button type="submit" loading={createMutation.isPending} style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>+ Add</Button>
      </form>

      {/* Task sections */}
      {pending.length > 0 && <TaskSection title="Today" tasks={pending} onToggle={id => { const t = tasks.find(x => x.id === id); if (t) toggleMutation.mutate({ id, state: toggle(t.state) }) }} onDelete={id => deleteMutation.mutate(id)} />}
      {delayed.length > 0 && <TaskSection title="Delayed" tasks={delayed} onToggle={id => { const t = tasks.find(x => x.id === id); if (t) toggleMutation.mutate({ id, state: toggle(t.state) }) }} onDelete={id => deleteMutation.mutate(id)} accent="var(--color-warning)" />}
      {done.length > 0 && <TaskSection title="Completed" tasks={done} onToggle={id => { const t = tasks.find(x => x.id === id); if (t) toggleMutation.mutate({ id, state: toggle(t.state) }) }} onDelete={id => deleteMutation.mutate(id)} accent="var(--color-success)" />}

      {/* Heatmap */}
      <div style={{ background: 'rgba(26,28,35,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', marginTop: '8px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>30-Day History</div>
        <HeatmapCalendar history={history} />
      </div>
    </PageLayout>
  )
}

function TaskSection({ title, tasks, onToggle, onDelete, accent }: { title: string; tasks: any[]; onToggle: (id: string) => void; onDelete: (id: string) => void; accent?: string }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: accent ?? 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{title} ({tasks.length})</div>
      <div style={{ background: 'rgba(26,28,35,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
        {tasks.map(t => (
          <TaskRow key={t.id} id={t.id} title={t.title} state={t.state} dueTime={t.due_time} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
