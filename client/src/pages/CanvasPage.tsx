import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { NoteEditor } from '../components/notes/NoteEditor'
import { PlusIcon, PinIcon, TrashIcon, DownloadIcon } from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_NOTES } from '../lib/mockData'
import api from '../lib/api'

interface Note {
  id: string; title: string; body: string
  tag_label?: string | null; tag_color?: string | null
  pinned: boolean; locked?: boolean; category?: string | null
}

const Y = 'var(--color-accent)'
const MINT = '#00E5A0'

function wc(t: string) { return t.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length }
function rt(t: string) { const m = Math.ceil(wc(t) / 200); return m < 1 ? '<1m' : m + 'm' }
function pv(body: string) {
  return body.replace(/<[^>]*>/g, '').replace(/[#*`>]/g, '').split('\n').filter((l: string) => l.trim()).slice(0, 2).join(' ').slice(0, 80)
}

export default function CanvasPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pinned'>('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [previewNotes, setPreviewNotes] = useState<Note[]>(MOCK_NOTES as Note[])

  const { data: serverNotes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => api.get('/api/v1/notes').then(r => r.data.data),
    enabled: !IS_PREVIEW,
  })
  const notes: Note[] = IS_PREVIEW ? previewNotes : serverNotes

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/v1/notes', { title: 'Untitled', body: '' }),
    onSuccess: res => { qc.invalidateQueries({ queryKey: ['notes'] }); setEditingId(res.data.data.id) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete('/api/v1/notes/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })
  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => api.patch('/api/v1/notes/' + id, { pinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  function handleCreate() {
    if (IS_PREVIEW) { const id = 'pn-' + Date.now(); setPreviewNotes(p => [{ id, title: 'Untitled', body: '', pinned: false }, ...p]); setEditingId(id) }
    else createMutation.mutate()
  }
  function handleDelete(id: string) {
    if (IS_PREVIEW) setPreviewNotes(p => p.filter(n => n.id !== id))
    else deleteMutation.mutate(id)
  }
  function handlePin(id: string, pinned: boolean) {
    if (IS_PREVIEW) setPreviewNotes(p => p.map(n => n.id === id ? { ...n, pinned } : n))
    else pinMutation.mutate({ id, pinned })
  }

  // Unique categories from notes
  const categories = Array.from(new Set(notes.map(n => n.category).filter(Boolean))) as string[]

  const pinnedCount = notes.filter(n => n.pinned).length
  const totalWords = notes.reduce((s, n) => s + wc(n.body), 0)
  const filtered = notes
    .filter(n => filter === 'pinned' ? n.pinned : true)
    .filter(n => !categoryFilter || n.category === categoryFilter)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))

  if (editingId) {
    const note = notes.find(n => n.id === editingId)
    return (
      <NoteEditor
        noteId={editingId}
        initialTitle={note?.title ?? ''}
        initialBody={note?.body ?? ''}
        initialTagLabel={note?.tag_label}
        initialTagColor={note?.tag_color}
        initialCategory={note?.category}
        initialLocked={note?.locked}
        onClose={() => { setEditingId(null); if (!IS_PREVIEW) qc.invalidateQueries({ queryKey: ['notes'] }) }}
      />
    )
  }

  return (
    <PageLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2.2rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1 }}>CANVAS</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>Your notes and ideas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={import.meta.env.VITE_API_URL + '/api/v1/notes/export'} download style={{ padding: '8px 10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}><DownloadIcon size={15} /></a>
          <button onClick={handleCreate} style={{ padding: '8px 14px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.85rem', letterSpacing: '0.06em', color: '#0A0A0F', display: 'flex', alignItems: 'center', gap: '4px' }}><PlusIcon size={14} /> NEW NOTE</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[{ value: notes.length, label: 'NOTES', color: Y }, { value: pinnedCount, label: 'PINNED', color: MINT }, { value: totalWords.toLocaleString(), label: 'WORDS', color: 'var(--color-text-secondary)' }].map(({ value, label, color }) => (
          <div key={label} style={{ flex: 1, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.9rem', color, marginBottom: '5px', lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search notes...' className='input-field' style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          {[{ id: 'all', label: 'ALL' }, { id: 'pinned', label: 'PINNED' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid', borderColor: filter === f.id ? Y : 'var(--color-border)', background: filter === f.id ? Y + '12' : 'transparent', color: filter === f.id ? Y : 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => setCategoryFilter('')} style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid', borderColor: !categoryFilter ? Y : 'var(--color-border)', background: !categoryFilter ? Y + '15' : 'transparent', color: !categoryFilter ? Y : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-head)', letterSpacing: '0.06em' }}>ALL</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', border: '1px solid', borderColor: categoryFilter === cat ? Y : 'var(--color-border)', background: categoryFilter === cat ? Y + '15' : 'transparent', color: categoryFilter === cat ? Y : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-head)', letterSpacing: '0.06em' }}>{cat}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px 20px' }}>
          <svg width='48' height='48' viewBox='0 0 48 48' fill='none' style={{ opacity: 0.2 }}><circle cx='24' cy='24' r='22' stroke='var(--color-text-muted)' strokeWidth='2' /><path d='M2 24 H46' stroke='var(--color-text-muted)' strokeWidth='2' /><circle cx='24' cy='24' r='6' stroke='var(--color-text-muted)' strokeWidth='2' fill='var(--color-surface)' /></svg>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{search ? 'No notes matching that search.' : 'Nothing here, Trainer.'}</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
          {filtered.map(note => (
            <div key={note.id}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '12px', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '130px', transition: 'border-color 150ms, background 150ms' }}
              onClick={() => setEditingId(note.id)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = Y; e.currentTarget.style.background = 'var(--glass-bg-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-bg)' }}
            >
              {note.tag_color && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: note.tag_color, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />}
              <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                {note.locked && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
                {note.pinned && <span style={{ color: Y, fontSize: '0.7rem' }}>📌</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.85rem', letterSpacing: '0.02em', color: 'var(--color-text-primary)', paddingRight: '20px', lineHeight: 1.3, marginTop: note.tag_color ? '4px' : '0' }}>{note.title || 'Untitled'}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1 }}>{pv(note.body) || 'Empty note'}</div>
              {note.category && (
                <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 'var(--radius-pill)', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', fontSize: '0.6rem', fontFamily: 'var(--font-head)', letterSpacing: '0.06em', alignSelf: 'flex-start' }}>{note.category}</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{rt(note.body)}</span>
                <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => handlePin(note.id, !note.pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? Y : 'var(--color-text-muted)', padding: '3px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}><PinIcon size={11} /></button>
                  <button onClick={() => handleDelete(note.id)} className='btn-danger-hover' style={{ padding: '3px' }}><TrashIcon size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleCreate} style={{ position: 'fixed', bottom: '88px', right: '20px', width: '44px', height: '44px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#0A0A0F', fontWeight: 700, zIndex: 140 }}>+</button>
    </PageLayout>
  )
}
