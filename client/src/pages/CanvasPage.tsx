import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { NoteCard } from '../components/notes/NoteCard'
import { NoteEditor } from '../components/notes/NoteEditor'
import { EmptyState } from '../components/ui/EmptyState'
import { IS_PREVIEW, MOCK_NOTES } from '../lib/mockData'
import api from '../lib/api'

interface Note {
  id: string; title: string; body: string
  tag_label?: string | null; tag_color?: string | null; pinned: boolean
}

export default function CanvasPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pinned'>('all')

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_NOTES as Note[]) : api.get('/api/v1/notes').then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/v1/notes', { title: 'New Note', body: ' ' }),
    onSuccess: res => { qc.invalidateQueries({ queryKey: ['notes'] }); setEditingId(res.data.data.id) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => api.patch(`/api/v1/notes/${id}`, { pinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  const pinnedCount = notes.filter(n => n.pinned).length
  const filtered = filter === 'pinned' ? notes.filter(n => n.pinned) : notes

  if (editingId) {
    const note = notes.find(n => n.id === editingId)
    return (
      <NoteEditor
        noteId={editingId}
        initialTitle={note?.title ?? ''}
        initialBody={note?.body ?? ''}
        initialTagLabel={note?.tag_label}
        initialTagColor={note?.tag_color}
        onClose={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ['notes'] }) }}
      />
    )
  }

  return (
    <PageLayout title="Canvas">
      {/* Header actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
          {(['all', 'pinned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '999px', border: '1px solid',
              borderColor: filter === f ? 'var(--color-accent)' : 'var(--color-border)',
              background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: filter === f ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize',
            }}>{f === 'pinned' ? `📌 Pinned (${pinnedCount})` : `All (${notes.length})`}</button>
          ))}
        </div>
        <button onClick={() => createMutation.mutate()} style={{
          padding: '8px 16px', borderRadius: '999px', background: 'var(--color-accent)',
          border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
        }}>+ New</button>
        <a href={`${import.meta.env.VITE_API_URL}/api/v1/notes/export`} download style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}>Export</a>
      </div>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <EmptyState message={filter === 'pinned' ? 'No pinned notes' : 'No notes yet. Create your first note.'} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              id={note.id} title={note.title} body={note.body}
              tagLabel={note.tag_label} tagColor={note.tag_color}
              pinned={note.pinned} pinnedCount={pinnedCount}
              onOpen={setEditingId}
              onPin={id => pinMutation.mutate({ id, pinned: !note.pinned })}
              onDelete={id => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </PageLayout>
  )
}
