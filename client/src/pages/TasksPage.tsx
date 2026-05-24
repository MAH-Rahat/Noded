import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { RadialProgressRing } from '../components/charts/RadialProgressRing'
import { HeatmapCalendar } from '../components/tasks/HeatmapCalendar'
import { useTaskStateMachine } from '../hooks/useTaskStateMachine'
import { PlusIcon, TrashIcon, ClockIcon, FlameIcon, ChevronRightIcon, FileTextIcon } from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_TASKS, MOCK_HISTORY } from '../lib/mockData'
import api from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Task {
  id: string
  title: string
  state: 'pending' | 'completed' | 'delayed'
  date: string
  due_time: string | null
  priority: 'high' | 'medium' | 'low'
  notes: string | null
  repeat: string | null
  list_id: string | null
  parent_id: string | null
  subtasks: Task[]
  sort_order: number
  created_at: string
  updated_at: string
}

interface TaskList {
  id: string
  name: string
  color: string
  is_active: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0]
const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()
const weekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] })()

function getBucket(date: string): 'overdue' | 'today' | 'tomorrow' | 'thisweek' | 'later' {
  if (date < today) return 'overdue'
  if (date === today) return 'today'
  if (date === tomorrow) return 'tomorrow'
  if (date <= weekEnd) return 'thisweek'
  return 'later'
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const PRIORITY_COLOR = { high: '#F43F5E', medium: '#F59E0B', low: '#10B981' }
const PRIORITY_LABEL = { high: 'HIGH', medium: 'MED', low: 'LOW' }

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority ?? 'low'] - PRIORITY_ORDER[b.priority ?? 'low'])
}

function isDecayed(task: Task): boolean {
  if (task.priority !== 'high' || task.state !== 'pending') return false
  const created = new Date(task.created_at || task.date)
  const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 2
}

const BUCKET_META: Record<string, { label: string; color: string }> = {
  overdue:   { label: 'OVERDUE',    color: '#F43F5E' },
  today:     { label: 'TODAY',      color: 'var(--color-accent)' },
  tomorrow:  { label: 'TOMORROW',   color: '#F59E0B' },
  thisweek:  { label: 'THIS WEEK',  color: '#3B82F6' },
  later:     { label: 'LATER',      color: 'var(--color-text-muted)' },
}
const BUCKET_ORDER = ['overdue', 'today', 'tomorrow', 'thisweek', 'later']

// ── Mock data augmentation ────────────────────────────────────────────────────
const MOCK_TASKS_FULL: Task[] = MOCK_TASKS.map((t, i) => ({
  ...t,
  priority: (['high', 'medium', 'low'] as const)[i % 3],
  notes: null,
  repeat: null,
  list_id: null,
  parent_id: null,
  subtasks: [],
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
} as Task))

// ── SubTask Row ───────────────────────────────────────────────────────────────
function SubtaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 16px 8px 40px',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(255,255,255,0.015)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
          border: `1.5px solid ${task.state === 'completed' ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'}`,
          background: task.state === 'completed' ? 'var(--color-accent)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 150ms',
        }}
      >
        {task.state === 'completed' && (
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l3 3 5-5" className="checkmark-path" />
          </svg>
        )}
      </button>
      <span style={{
        flex: 1, fontSize: '0.8rem',
        color: task.state === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
        textDecoration: task.state === 'completed' ? 'line-through' : 'none',
      }}>{task.title}</span>
      <button onClick={onDelete} className="btn-danger-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
        <TrashIcon size={11} />
      </button>
    </div>
  )
}

// ── Task Card ─────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task
  isLast: boolean
  onToggle: () => void
  onDelete: () => void
  onAddSubtask: (parentId: string, title: string) => void
  onToggleSubtask: (id: string, state: string) => void
  onDeleteSubtask: (id: string) => void
  onUpdateNotes: (id: string, notes: string) => void
}

function TaskCard({ task, isLast, onToggle, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask, onUpdateNotes }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesValue, setNotesValue] = useState(task.notes ?? '')
  const [subtaskInput, setSubtaskInput] = useState('')
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)
  const decayed = isDecayed(task)

  function handleNotesBlur() {
    if (notesValue !== (task.notes ?? '')) {
      onUpdateNotes(task.id, notesValue)
    }
  }

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!subtaskInput.trim()) return
    onAddSubtask(task.id, subtaskInput.trim())
    setSubtaskInput('')
    setShowSubtaskInput(false)
  }

  const priorityColor = PRIORITY_COLOR[task.priority ?? 'low']
  const hasSubtasks = task.subtasks && task.subtasks.length > 0

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
      background: task.state === 'completed' ? 'rgba(16,185,129,0.04)' : 'transparent',
      transition: 'background 150ms',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px' }}>
        {/* Priority stripe */}
        <div style={{ width: '3px', height: '28px', borderRadius: '2px', background: priorityColor, flexShrink: 0, opacity: task.state === 'completed' ? 0.3 : 1 }} />

        {/* Checkbox */}
        <button
          onClick={onToggle}
          style={{
            width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
            border: `1.5px solid ${task.state === 'completed' ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'}`,
            background: task.state === 'completed' ? 'var(--color-accent)' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 150ms',
            boxShadow: task.state === 'completed' ? '0 0 8px var(--color-accent-glow)' : 'none',
          }}
        >
          {task.state === 'completed' && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6l3 3 5-5" className="checkmark-path" />
            </svg>
          )}
        </button>

        {/* Title + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.875rem',
              color: task.state === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              textDecoration: task.state === 'completed' ? 'line-through' : 'none',
            }}>{task.title}</span>
            {decayed && <span title="High priority task pending for 2+ days" style={{ fontSize: '0.75rem' }}>⚠</span>}
            {/* Show date badge if not today */}
            {task.date !== today && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: task.date < today ? '#F43F5E' : '#3B82F6', background: task.date < today ? 'rgba(244,63,94,0.1)' : 'rgba(59,130,246,0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                {new Date(task.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {task.repeat && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.12)', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {task.repeat}
              </span>
            )}
            {task.state === 'delayed' && (
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Late</span>
            )}
          </div>
          {task.due_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              <ClockIcon size={10} />
              {task.due_time.includes('T')
                ? new Date(task.due_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : task.due_time}
            </div>
          )}
        </div>

        {/* Note icon */}
        <button
          onClick={() => setNotesOpen(o => !o)}
          title="Toggle notes"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px',
            color: (task.notes || notesOpen) ? 'var(--color-accent)' : 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', transition: 'color 150ms',
          }}
        >
          <FileTextIcon size={13} />
        </button>

        {/* Expand subtasks */}
        {hasSubtasks && (
          <button
            onClick={() => setExpanded(o => !o)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px',
              color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', transition: 'transform 150ms, color 150ms',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronRightIcon size={13} />
          </button>
        )}

        {/* Add subtask */}
        <button
          onClick={() => { setShowSubtaskInput(o => !o); setExpanded(true) }}
          title="Add subtask"
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px',
            color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', fontSize: '0.65rem',
            fontWeight: 700, gap: '2px', transition: 'color 150ms',
          }}
        >
          <PlusIcon size={10} />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="btn-danger-hover"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
        >
          <TrashIcon size={13} />
        </button>
      </div>

      {/* Notes textarea */}
      {notesOpen && (
        <div style={{ padding: '0 16px 12px 49px' }}>
          <textarea
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes…"
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)',
              fontSize: '0.8rem', padding: '8px 10px', outline: 'none', resize: 'vertical',
              transition: 'border-color 150ms',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--color-accent)' }}
          />
        </div>
      )}

      {/* Subtasks */}
      {expanded && hasSubtasks && sortByPriority(task.subtasks).map(sub => (
        <SubtaskRow
          key={sub.id}
          task={sub}
          onToggle={() => onToggleSubtask(sub.id, sub.state)}
          onDelete={() => onDeleteSubtask(sub.id)}
        />
      ))}

      {/* Add subtask input */}
      {showSubtaskInput && (
        <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '6px', padding: '6px 16px 10px 40px' }}>
          <input
            autoFocus
            value={subtaskInput}
            onChange={e => setSubtaskInput(e.target.value)}
            placeholder="Subtask title…"
            style={{
              flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px',
              color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', outline: 'none',
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '6px 10px', borderRadius: '7px', fontSize: '0.75rem' }}>Add</button>
          <button type="button" onClick={() => setShowSubtaskInput(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '6px', borderRadius: '7px', fontSize: '0.8rem' }}>✕</button>
        </form>
      )}
    </div>
  )
}

// ── Bucket Section ────────────────────────────────────────────────────────────
interface BucketSectionProps {
  bucketKey: string
  tasks: Task[]
  onToggle: (id: string, state: string) => void
  onDelete: (id: string) => void
  onAddSubtask: (parentId: string, title: string) => void
  onToggleSubtask: (id: string, state: string) => void
  onDeleteSubtask: (id: string) => void
  onUpdateNotes: (id: string, notes: string) => void
}

function BucketSection({ bucketKey, tasks, onToggle, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask, onUpdateNotes }: BucketSectionProps) {
  const [open, setOpen] = useState(true)
  const [completedOpen, setCompletedOpen] = useState(false)
  const meta = BUCKET_META[bucketKey]
  const pending = sortByPriority(tasks.filter(t => t.state !== 'completed'))
  const completed = tasks.filter(t => t.state === 'completed')

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Bucket header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0', width: '100%', textAlign: 'left',
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.color}`, flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {meta.label} ({tasks.length})
        </span>
        <ChevronRightIcon size={12} style={{ color: 'var(--color-text-muted)', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms', marginLeft: 'auto' }} />
      </button>

      {open && (
        <>
          {/* Pending tasks */}
          {pending.length > 0 && (
            <div className="glass-card" style={{ overflow: 'hidden', marginBottom: completed.length > 0 ? '6px' : '0' }}>
              {pending.map((t, i) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isLast={i === pending.length - 1}
                  onToggle={() => onToggle(t.id, t.state)}
                  onDelete={() => onDelete(t.id)}
                  onAddSubtask={onAddSubtask}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onUpdateNotes={onUpdateNotes}
                />
              ))}
            </div>
          )}

          {/* Completed toggle */}
          {completed.length > 0 && (
            <div>
              <button
                onClick={() => setCompletedOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.72rem', fontWeight: 600,
                }}
              >
                <ChevronRightIcon size={11} style={{ transform: completedOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }} />
                Completed ({completed.length})
              </button>
              {completedOpen && (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  {completed.map((t, i) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      isLast={i === completed.length - 1}
                      onToggle={() => onToggle(t.id, t.state)}
                      onDelete={() => onDelete(t.id)}
                      onAddSubtask={onAddSubtask}
                      onToggleSubtask={onToggleSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                      onUpdateNotes={onUpdateNotes}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const qc = useQueryClient()
  const { toggle } = useTaskStateMachine()

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState(today)
  const [newTime, setNewTime] = useState('')
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [newRepeat, setNewRepeat] = useState<string>('')
  const [newListId, setNewListId] = useState<string>('')
  const [activeListId, setActiveListId] = useState<string>('all')
  const [sortMode, setSortMode] = useState<'date' | 'priority'>('date')
  const [showNewListForm, setShowNewListForm] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListColor, setNewListColor] = useState('#6390F0')

  // Local state for preview mode tasks
  const [previewTasks, setPreviewTasks] = useState<Task[]>(MOCK_TASKS_FULL)

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: serverTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', 'all', activeListId],
    queryFn: () => api.get(`/api/v1/tasks/all${activeListId !== 'all' ? `?list_id=${activeListId}` : ''}`).then(r => r.data.data),
    enabled: !IS_PREVIEW,
  })

  const { data: taskLists = [] } = useQuery<TaskList[]>({
    queryKey: ['tasks', 'lists'],
    queryFn: () => api.get('/api/v1/tasks/lists').then(r => r.data.data),
    enabled: !IS_PREVIEW,
  })

  const { data: history = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['tasks', 'history'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_HISTORY) : api.get('/api/v1/tasks/history').then(r => r.data.data),
  })

  // Filter out completed tasks older than 2 days (they'll be auto-deleted by backend)
  const TWO_DAYS_AGO = new Date(); TWO_DAYS_AGO.setDate(TWO_DAYS_AGO.getDate() - 2)
  const allTasks: Task[] = (IS_PREVIEW ? previewTasks : serverTasks).filter(t => {
    if (t.state !== 'completed') return true
    const taskDate = new Date(t.date + 'T00:00:00')
    return taskDate > TWO_DAYS_AGO
  })

  // ── Mutations (real backend) ──────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: string }) =>
      api.patch(`/api/v1/tasks/${id}`, { state }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'all'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'all'] }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/api/v1/tasks', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'all'] })
      setNewTitle('')
      setNewTime('')
    },
  })

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.patch(`/api/v1/tasks/${id}`, { notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'all'] }),
  })

  const createListMutation = useMutation({
    mutationFn: (payload: { name: string; color: string; is_active: boolean }) =>
      api.post('/api/v1/tasks/lists', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'lists'] })
      setShowNewListForm(false)
      setNewListName('')
    },
  })

  // ── Preview handlers ──────────────────────────────────────────────────────
  function previewToggle(id: string) {
    setPreviewTasks(prev => prev.map(t => {
      if (t.id === id) return { ...t, state: toggle(t.state as any) }
      // also check subtasks
      return { ...t, subtasks: (t.subtasks || []).map(s => s.id === id ? { ...s, state: toggle(s.state as any) } : s) }
    }))
  }

  function previewDelete(id: string) {
    setPreviewTasks(prev => prev
      .filter(t => t.id !== id)
      .map(t => ({ ...t, subtasks: (t.subtasks || []).filter(s => s.id !== id) }))
    )
  }

  function previewCreate(payload: Record<string, unknown>) {
    const newTask: Task = {
      id: `preview-${Date.now()}`,
      title: payload.title as string,
      state: 'pending',
      sort_order: previewTasks.length,
      date: (payload.date as string) || today,
      due_time: (payload.due_time as string) || null,
      priority: (payload.priority as 'high' | 'medium' | 'low') || 'medium',
      notes: null,
      repeat: (payload.repeat as string) || null,
      list_id: (payload.list_id as string) || null,
      parent_id: null,
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setPreviewTasks(prev => [...prev, newTask])
    setNewTitle('')
    setNewTime('')
  }

  function previewAddSubtask(parentId: string, title: string) {
    const sub: Task = {
      id: `preview-sub-${Date.now()}`,
      title,
      state: 'pending',
      sort_order: 0,
      date: today,
      due_time: null,
      priority: 'medium',
      notes: null,
      repeat: null,
      list_id: null,
      parent_id: parentId,
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setPreviewTasks(prev => prev.map(t => t.id === parentId ? { ...t, subtasks: [...(t.subtasks || []), sub] } : t))
  }

  function previewUpdateNotes(id: string, notes: string) {
    setPreviewTasks(prev => prev.map(t => t.id === id ? { ...t, notes } : t))
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
    const payload: Record<string, unknown> = {
      title: newTitle.trim(),
      date: newDate || today,
      priority: newPriority,
    }
    if (newTime) payload.due_time = newTime
    if (newRepeat) payload.repeat = newRepeat
    if (newListId) payload.list_id = newListId
    if (IS_PREVIEW) {
      previewCreate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleAddSubtask(parentId: string, title: string) {
    if (IS_PREVIEW) {
      previewAddSubtask(parentId, title)
    } else {
      createMutation.mutate({ title, date: today, priority: 'medium', parent_id: parentId })
    }
  }

  function handleUpdateNotes(id: string, notes: string) {
    if (IS_PREVIEW) {
      previewUpdateNotes(id, notes)
    } else {
      updateNotesMutation.mutate({ id, notes })
    }
  }

  function handleCreateList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListName.trim()) return
    if (!IS_PREVIEW) {
      createListMutation.mutate({ name: newListName.trim(), color: newListColor, is_active: true })
    } else {
      setShowNewListForm(false)
      setNewListName('')
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  // Only count top-level tasks for today's stats
  const todayTasks = allTasks.filter(t => t.date === today && !t.parent_id)
  const completed = todayTasks.filter(t => t.state === 'completed').length
  const total = todayTasks.length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  const streak = (() => {
    let count = 0; const d = new Date()
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split('T')[0]
      if ((history as any)[key]) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  })()

  // ── Bucket grouping ───────────────────────────────────────────────────────
  const rootTasks = allTasks.filter(t => !t.parent_id)
  const filteredTasks = activeListId === 'all' ? rootTasks : rootTasks.filter(t => t.list_id === activeListId)

  // Priority mode: single flat bucket sorted by priority then date
  const prioritySorted = useMemo(() => sortByPriority(
    [...filteredTasks].sort((a, b) => a.date.localeCompare(b.date))
  ), [filteredTasks])

  const buckets = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const key of BUCKET_ORDER) map[key] = []
    for (const t of filteredTasks) {
      const b = getBucket(t.date)
      map[b].push(t)
    }
    return map
  }, [filteredTasks])

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

      {/* List tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* All tab */}
        <button
          onClick={() => setActiveListId('all')}
          style={{
            padding: '5px 14px', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 600,
            border: `1px solid ${activeListId === 'all' ? 'var(--color-accent)' : 'var(--glass-border)'}`,
            background: activeListId === 'all' ? 'var(--color-accent-dim)' : 'transparent',
            color: activeListId === 'all' ? 'var(--color-accent)' : 'var(--color-text-muted)',
            cursor: 'pointer', transition: 'all 150ms',
          }}
        >All</button>

        {taskLists.map(list => (
          <button
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            style={{
              padding: '5px 14px', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 600,
              border: `1px solid ${activeListId === list.id ? list.color : 'var(--glass-border)'}`,
              background: activeListId === list.id ? `${list.color}22` : 'transparent',
              color: activeListId === list.id ? list.color : 'var(--color-text-muted)',
              cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: list.color, flexShrink: 0 }} />
            {list.name}
          </button>
        ))}

        {/* New list button */}
        <button
          onClick={() => setShowNewListForm(o => !o)}
          style={{
            padding: '5px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', fontWeight: 600,
            border: '1px dashed var(--glass-border)', background: 'transparent',
            color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'all 150ms',
          }}
        >
          <PlusIcon size={11} /> New List
        </button>
      </div>

      {/* New list form */}
      {showNewListForm && (
        <form onSubmit={handleCreateList} className="glass-card" style={{ padding: '14px 16px', marginBottom: '14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            autoFocus
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            placeholder="List name…"
            style={{
              flex: 1, minWidth: '120px', padding: '7px 10px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
              color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', outline: 'none',
            }}
          />
          <input
            type="color"
            value={newListColor}
            onChange={e => setNewListColor(e.target.value)}
            style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>Create</button>
          <button type="button" onClick={() => setShowNewListForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '7px', borderRadius: '8px', fontSize: '0.85rem' }}>✕</button>
        </form>
      )}

      {/* Add task form */}
      <form onSubmit={handleCreate} className="glass-card" style={{ padding: '14px 16px', marginBottom: '20px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Add a new task…"
            className="input-accent"
            style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none' }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', flexShrink: 0 }}
          >
            <PlusIcon size={16} /> Add
          </button>
        </div>

        {/* Options row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date picker */}
          <input
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            style={{
              padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', outline: 'none',
              colorScheme: 'dark',
            }}
          />

          {/* Time picker */}
          <input
            type="time"
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
            style={{
              padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', outline: 'none',
              colorScheme: 'dark',
            }}
          />

          {/* Priority selector */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['high', 'medium', 'low'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setNewPriority(p)}
                style={{
                  padding: '4px 9px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700,
                  border: `1px solid ${newPriority === p ? PRIORITY_COLOR[p] : 'rgba(255,255,255,0.1)'}`,
                  background: newPriority === p ? `${PRIORITY_COLOR[p]}22` : 'transparent',
                  color: newPriority === p ? PRIORITY_COLOR[p] : 'var(--color-text-muted)',
                  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 150ms',
                }}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>

          {/* Repeat selector */}
          <select
            value={newRepeat}
            onChange={e => setNewRepeat(e.target.value)}
            style={{
              padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: newRepeat ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)', fontSize: '0.78rem', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {/* List selector */}
          {taskLists.length > 0 && (
            <select
              value={newListId}
              onChange={e => setNewListId(e.target.value)}
              style={{
                padding: '5px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: newListId ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-ui)', fontSize: '0.78rem', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="">No list</option>
              {taskLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          )}
        </div>
      </form>

      {/* Sort controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>SORT:</span>
        {(['date', 'priority'] as const).map(mode => (
          <button key={mode} onClick={() => setSortMode(mode)} style={{
            padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', fontWeight: 600,
            border: `1px solid ${sortMode === mode ? 'var(--color-accent)' : 'var(--glass-border)'}`,
            background: sortMode === mode ? 'var(--color-accent-dim)' : 'transparent',
            color: sortMode === mode ? 'var(--color-accent)' : 'var(--color-text-muted)',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 150ms',
          }}>{mode === 'date' ? '📅 Date' : '🔴 Priority'}</button>
        ))}
      </div>

      {/* Date buckets or priority view */}
      {sortMode === 'date' ? (
        <>
          {BUCKET_ORDER.filter(b => buckets[b].length > 0).map(b => (
            <BucketSection
              key={b}
              bucketKey={b}
              tasks={buckets[b]}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggle}
              onDeleteSubtask={handleDelete}
              onUpdateNotes={handleUpdateNotes}
            />
          ))}
          {filteredTasks.length === 0 && (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No tasks yet. Add one above.</div>
            </div>
          )}
        </>
      ) : (
        /* Priority view — flat list, HIGH first */
        <div>
          {(['high', 'medium', 'low'] as const).map(p => {
            const pTasks = prioritySorted.filter(t => (t.priority ?? 'medium') === p)
            if (pTasks.length === 0) return null
            return (
              <div key={p} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_COLOR[p], boxShadow: `0 0 6px ${PRIORITY_COLOR[p]}` }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIORITY_COLOR[p], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {p} PRIORITY ({pTasks.filter(t => t.state !== 'completed').length})
                  </span>
                </div>
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  {pTasks.filter(t => t.state !== 'completed').map((t, i, arr) => (
                    <TaskCard key={t.id} task={t} isLast={i === arr.length - 1}
                      onToggle={() => handleToggle(t.id, t.state)} onDelete={() => handleDelete(t.id)}
                      onAddSubtask={handleAddSubtask} onToggleSubtask={handleToggle}
                      onDeleteSubtask={handleDelete} onUpdateNotes={handleUpdateNotes} />
                  ))}
                </div>
              </div>
            )
          })}
          {prioritySorted.filter(t => t.state !== 'completed').length === 0 && (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No tasks yet. Add one above.</div>
            </div>
          )}
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