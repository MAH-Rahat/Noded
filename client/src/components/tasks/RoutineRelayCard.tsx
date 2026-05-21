import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ModuleCard } from '../layout/ModuleCard'
import { RadialProgressRing } from '../charts/RadialProgressRing'
import { TaskRow } from './TaskRow'
import { HeatmapCalendar } from './HeatmapCalendar'
import { StreakCounter } from './StreakCounter'
import { SkeletonBlock } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useTaskStateMachine } from '../../hooks/useTaskStateMachine'
import api from '../../lib/api'

interface Task {
  id: string
  title: string
  state: 'pending' | 'completed' | 'delayed'
  sort_order: number
  due_time?: string | null
}

function SortableTaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <TaskRow
        id={task.id}
        title={task.title}
        state={task.state}
        dueTime={task.due_time}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </div>
  )
}

export function RoutineRelayCard() {
  const qc = useQueryClient()
  const { toggle } = useTaskStateMachine()
  const [newTitle, setNewTitle] = useState('')
  const sensors = useSensors(useSensor(PointerSensor))

  const today = new Date().toISOString().split('T')[0]

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', today],
    queryFn: () => api.get(`/api/v1/tasks?date=${today}`).then((r) => r.data.data),
  })

  const { data: history = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['tasks', 'history'],
    queryFn: () => api.get('/api/v1/tasks/history').then((r) => r.data.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, state }: { id: string; state: string }) =>
      api.patch(`/api/v1/tasks/${id}`, { state }),
    onMutate: async ({ id, state }) => {
      await qc.cancelQueries({ queryKey: ['tasks', today] })
      const prev = qc.getQueryData<Task[]>(['tasks', today])
      qc.setQueryData<Task[]>(['tasks', today], (old = []) =>
        old.map((t) => (t.id === id ? { ...t, state: state as Task['state'] } : t))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', today], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', today] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', today] }),
  })

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      api.post('/api/v1/tasks', { title, date: today }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', today] })
      setNewTitle('')
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sort_order: number }[]) =>
      api.patch('/api/v1/tasks/reorder', { tasks: items }),
  })

  function handleToggle(id: string) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const newState = toggle(task.state)
    toggleMutation.mutate({ id, state: newState })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(tasks, oldIndex, newIndex)
    qc.setQueryData(['tasks', today], reordered)
    reorderMutation.mutate(reordered.map((t, i) => ({ id: t.id, sort_order: i })))
  }

  const completed = tasks.filter((t) => t.state === 'completed').length
  const total = tasks.length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  // Streak: count consecutive days of full completion
  const streak = (() => {
    let count = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().split('T')[0]
      if (history[key]) { count++; d.setDate(d.getDate() - 1) }
      else break
    }
    return count
  })()

  return (
    <ModuleCard title="Routine & Relay">
      {isLoading ? (
        <SkeletonBlock lines={4} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Progress ring + streak */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <RadialProgressRing percent={percent} label={`${completed}/${total} done`} />
            <StreakCounter streak={streak} />
          </div>

          {/* Progress bar */}
          <div style={{ height: '4px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, backgroundColor: 'var(--color-accent)', borderRadius: 'var(--radius-pill)', transition: 'width 400ms ease-out' }} />
          </div>

          {/* Task list */}
          {tasks.length === 0 ? (
            <EmptyState message="No tasks today. Add one below." />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {tasks.map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Add task */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) createMutation.mutate(newTitle.trim()) }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a task..."
              style={{ fontSize: '0.85rem', padding: '7px 12px' }}
            />
            <Button type="submit" loading={createMutation.isPending} style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
              +
            </Button>
          </form>

          {/* Heatmap */}
          <HeatmapCalendar history={history} />
        </div>
      )}
    </ModuleCard>
  )
}
