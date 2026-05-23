import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { NoteEditor } from '../components/notes/NoteEditor'
import { PlusIcon, PinIcon, TrashIcon, DownloadIcon } from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_NOTES } from '../lib/mockData'
import api from '../lib/api'

interface Note {
  id: string; title: string; body: string
  tag_label?: string | null; tag_color?: string | null; pinned: boolean
}

function wordCount(text: string) { return text.trim().split(/\s+/).filter(Boolean).length }
function readTime(text: string) { const m = Math.ceil(wordCount(text) / 200); return m < 1 ? '<1 min' : `${m} min` }
function preview(body: string) { return body.replace(/[#*`>]/g, '').split('\n').filter(l => l.trim()).slice(0, 2).join(' ').slice(0, 90) }

export default function CanvasPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pinned'>('all')
  const [search, setSearch] = useState('')

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_NOTES as Note[]) : api.get('/api/v1/notes').then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/v1/notes', { title: 'Untitled', body: ' ' }),
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
  const filtered = notes
    .filter(n => filter === 'pinned' ? n.pinned : true)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))

  if (editingId) {
    const note = notes.find(n => n.id === editingId)
    return <NoteEditor noteId={editingId} initialTitle={note?.title ?? ''} initialBody={note?.body ?? ''} initialTagLabel={note?.tag_label} initialTagColor={note?.tag_color} onClose={() => { setEditingId(null); qc.invalidateQueries({ queryKey: ['notes'] }) }} />
  }

  return (
    <PageLayout title="Canvas">
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Notes', value: notes.length },
          { label: 'Pinned', value: pinnedCount },
          { label: 'Words', value: notes.reduce((s, n) => s + wordCount(n.body), 0).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginTop: '3px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…"
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as any }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
        <button onClick={() => createMutation.mutate()} style={{ padding: '10px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', whiteSpace: 'nowrap' }}>
          <PlusIcon size={15} /> New
        </button>
        <a href={`${import.meta.env.VITE_API_URL}/api/v1/notes/export`} download style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <DownloadIcon size={16} />
        </a>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[{ id: 'all', label: `All (${notes.length})` }, { id: 'pinned', label: `Pinned (${pinnedCount})` }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id as any)} style={{
            padding: '6px 14px', borderRadius: '999px', border: '1px solid',
            borderColor: filter === f.id ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)',
            background: filter === f.id ? 'rgba(59,130,246,0.12)' : 'transparent',
            color: filter === f.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
            cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 600,
          }}>{f.label}</button>
        ))}
      </div>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {search ? `No notes matching "${search}"` : filter === 'pinned' ? 'No pinned notes' : 'No notes yet. Create your first note.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px' }}>
          {filtered.map(note => (
            <div key={note.id} className="glass-card hoverable" style={{ padding: '14px', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '140px' }}
              onClick={() => setEditingId(note.id)}
            >
              {/* Tag accent bar */}
              {note.tag_color && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: note.tag_color, borderRadius: '20px 20px 0 0' }} />}

              {/* Pin indicator */}
              {note.pinned && <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--color-accent)', opacity: 0.8 }}><PinIcon size={12} /></div>}

              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)', paddingRight: note.pinned ? '16px' : '0', lineHeight: 1.3 }}>
                {note.title || 'Untitled'}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1 }}>
                {preview(note.body) || 'Empty note'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {note.tag_color && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: note.tag_color }} />}
                  <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>{readTime(note.body)}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => pinMutation.mutate({ id: note.id, pinned: !note.pinned })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? 'var(--color-accent)' : 'var(--color-text-muted)', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    <PinIcon size={11} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(note.id)} className="btn-danger-hover" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    <TrashIcon size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
