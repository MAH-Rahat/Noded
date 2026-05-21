import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModuleCard } from '../layout/ModuleCard'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { EmptyState } from '../ui/EmptyState'
import { SkeletonBlock } from '../ui/Skeleton'
import api from '../../lib/api'
import { IS_PREVIEW, MOCK_NOTES } from '../../lib/mockData'

interface Note {
  id: string
  title: string
  body: string
  tag_label?: string | null
  tag_color?: string | null
  pinned: boolean
}

export function CanvasCard() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_NOTES as Note[]) : api.get('/api/v1/notes').then((r) => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/v1/notes', { title: 'New Note', body: ' ' }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['notes'] })
      setEditingId(res.data.data.id)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      api.patch(`/api/v1/notes/${id}`, { pinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  const pinnedCount = notes.filter((n) => n.pinned).length

  const exportMenu = (
    <a
      href={`${import.meta.env.VITE_API_URL}/api/v1/notes/export`}
      download="notes.zip"
      style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}
    >
      Export ZIP
    </a>
  )

  if (editingId) {
    const note = notes.find((n) => n.id === editingId)
    return (
      <NoteEditor
        noteId={editingId}
        initialTitle={note?.title ?? ''}
        initialBody={note?.body ?? ''}
        initialTagLabel={note?.tag_label}
        initialTagColor={note?.tag_color}
        onClose={() => {
          setEditingId(null)
          qc.invalidateQueries({ queryKey: ['notes'] })
        }}
      />
    )
  }

  return (
    <ModuleCard
      title="The Canvas"
      headerAction={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {exportMenu}
          <button
            onClick={() => createMutation.mutate()}
            style={{
              background: 'var(--color-accent)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '4px 10px',
            }}
          >
            + New
          </button>
        </div>
      }
    >
      {isLoading ? (
        <SkeletonBlock lines={4} />
      ) : notes.length === 0 ? (
        <EmptyState message="No notes yet. Create your first note." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '10px',
          }}
        >
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              id={note.id}
              title={note.title}
              body={note.body}
              tagLabel={note.tag_label}
              tagColor={note.tag_color}
              pinned={note.pinned}
              pinnedCount={pinnedCount}
              onOpen={setEditingId}
              onPin={(id) => pinMutation.mutate({ id, pinned: !note.pinned })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </ModuleCard>
  )
}
