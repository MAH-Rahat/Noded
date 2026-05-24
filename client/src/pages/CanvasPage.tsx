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

// Folder = a category name with a chosen color
interface Folder { name: string; color: string }

const Y = 'var(--color-accent)'
const MINT = '#00E5A0'
const FOLDER_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#06B6D4', '#F43F5E', '#84CC16']

function wc(t: string) { return t.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length }
function rt(t: string) { const m = Math.ceil(wc(t) / 200); return m < 1 ? '<1m' : m + 'm' }
function pv(body: string) {
  return body.replace(/<[^>]*>/g, '').replace(/[#*`>]/g, '').split('\n').filter((l: string) => l.trim()).slice(0, 2).join(' ').slice(0, 80)
}

// Lock PIN modal
function LockModal({ onUnlock, onCancel }: { onUnlock: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState('')
  const NOTES_PIN = localStorage.getItem('notes_pin') || '1234'
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin === NOTES_PIN) onUnlock()
    else { setPin(''); alert('Wrong PIN') }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', width: '280px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Protected Note</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Enter your notes PIN to view</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter PIN" autoFocus inputMode="numeric"
            style={{ padding: '10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '1rem', outline: 'none', textAlign: 'center', letterSpacing: '0.3em' }} />
          <button type="submit" className="btn-primary" style={{ padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>Unlock</button>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Cancel</button>
        </form>
      </div>
    </div>
  )
}

export default function CanvasPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pinned' | 'locked'>('all')
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState<string>('')
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])
  const [folders, setFolders] = useState<Folder[]>(() => {
    try { return JSON.parse(localStorage.getItem('note_folders') || '[]') } catch { return [] }
  })
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [previewNotes, setPreviewNotes] = useState<Note[]>(MOCK_NOTES as Note[])

  const { data: serverNotes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => api.get('/api/v1/notes').then(r => r.data.data),
    enabled: !IS_PREVIEW,
  })
  const notes: Note[] = IS_PREVIEW ? previewNotes : serverNotes

  const createMutation = useMutation({
    mutationFn: (cat?: string) => api.post('/api/v1/notes', { title: 'Untitled', body: '', category: cat || null }),
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

  function handleCreate(cat?: string) {
    if (IS_PREVIEW) { const id = 'pn-' + Date.now(); setPreviewNotes(p => [{ id, title: 'Untitled', body: '', pinned: false, category: cat || null }, ...p]); setEditingId(id) }
    else createMutation.mutate(cat)
  }
  function handleDelete(id: string) {
    if (IS_PREVIEW) setPreviewNotes(p => p.filter(n => n.id !== id))
    else deleteMutation.mutate(id)
  }
  function handlePin(id: string, pinned: boolean) {
    if (IS_PREVIEW) setPreviewNotes(p => p.map(n => n.id === id ? { ...n, pinned } : n))
    else pinMutation.mutate({ id, pinned })
  }
  function handleNoteClick(note: Note) {
    if (note.locked && !unlockedIds.has(note.id)) { setUnlockingId(note.id); return }
    setEditingId(note.id)
  }
  function handleUnlock() {
    if (unlockingId) { setUnlockedIds(prev => new Set([...prev, unlockingId])); setEditingId(unlockingId); setUnlockingId(null) }
  }
  function saveFolders(f: Folder[]) { setFolders(f); localStorage.setItem('note_folders', JSON.stringify(f)) }
  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault(); if (!newFolderName.trim()) return
    saveFolders([...folders, { name: newFolderName.trim(), color: newFolderColor }])
    setNewFolderName(''); setShowFolderForm(false)
  }
  function handleDeleteFolder(name: string) {
    saveFolders(folders.filter(f => f.name !== name))
    if (activeFolder === name) setActiveFolder('')
  }

  const pinnedCount = notes.filter(n => n.pinned).length
  const totalWords = notes.reduce((s, n) => s + wc(n.body), 0)

  const filtered = notes
    .filter(n => filter === 'pinned' ? n.pinned : filter === 'locked' ? n.locked : true)
    .filter(n => !activeFolder || n.category === activeFolder)
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
      {unlockingId && <LockModal onUnlock={handleUnlock} onCancel={() => setUnlockingId(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2.2rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1 }}>CANVAS</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>Your notes and ideas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={import.meta.env.VITE_API_URL + '/api/v1/notes/export'} download style={{ padding: '8px 10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}><DownloadIcon size={15} /></a>
          <button onClick={() => handleCreate(activeFolder || undefined)} style={{ padding: '8px 14px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.85rem', letterSpacing: '0.06em', color: '#0A0A0F', display: 'flex', alignItems: 'center', gap: '4px' }}><PlusIcon size={14} /> NEW NOTE</button>
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

      {/* Folders row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveFolder('')} style={{ padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${!activeFolder ? Y : 'var(--color-border)'}`, background: !activeFolder ? Y + '15' : 'transparent', color: !activeFolder ? Y : 'var(--color-text-muted)', cursor: 'pointer' }}>📁 All</button>
        {folders.map(f => (
          <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={() => setActiveFolder(activeFolder === f.name ? '' : f.name)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${activeFolder === f.name ? f.color : 'var(--color-border)'}`, background: activeFolder === f.name ? f.color + '20' : 'transparent', color: activeFolder === f.name ? f.color : 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.8rem' }}>📁</span>
              <span style={{ color: f.color }}>{f.name}</span>
            </button>
            <button onClick={() => handleDeleteFolder(f.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px' }}>✕</button>
          </div>
        ))}
        <button onClick={() => setShowFolderForm(o => !o)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><PlusIcon size={10} /> Folder</button>
      </div>

      {/* New folder form */}
      {showFolderForm && (
        <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name…" className="input-field" style={{ flex: 1, minWidth: '120px', padding: '7px 10px', fontSize: '0.85rem' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
            {FOLDER_COLORS.map(c => <button key={c} type="button" onClick={() => setNewFolderColor(c)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: newFolderColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />)}
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>Create</button>
          <button type="button" onClick={() => setShowFolderForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>✕</button>
        </form>
      )}

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search notes...' className='input-field' style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          {[{ id: 'all', label: 'ALL' }, { id: 'pinned', label: '📌' }, { id: 'locked', label: '🔒' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid', borderColor: filter === f.id ? Y : 'var(--color-border)', background: filter === f.id ? Y + '12' : 'transparent', color: filter === f.id ? Y : 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px 20px' }}>
          <svg width='48' height='48' viewBox='0 0 48 48' fill='none' style={{ opacity: 0.2 }}><circle cx='24' cy='24' r='22' stroke='var(--color-text-muted)' strokeWidth='2' /><path d='M2 24 H46' stroke='var(--color-text-muted)' strokeWidth='2' /><circle cx='24' cy='24' r='6' stroke='var(--color-text-muted)' strokeWidth='2' fill='var(--color-surface)' /></svg>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{search ? 'No notes matching that search.' : 'Nothing here, Trainer.'}</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
          {filtered.map(note => {
            const isLocked = note.locked && !unlockedIds.has(note.id)
            const folderColor = folders.find(f => f.name === note.category)?.color
            return (
              <div key={note.id}
                style={{ background: 'var(--glass-bg)', border: `1px solid ${folderColor ? folderColor + '40' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-md)', padding: '12px', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '130px', transition: 'border-color 150ms, background 150ms', overflow: 'hidden' }}
                onClick={() => handleNoteClick(note)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = folderColor || Y; e.currentTarget.style.background = 'var(--glass-bg-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = folderColor ? folderColor + '40' : 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-bg)' }}
              >
                {note.tag_color && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: note.tag_color, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />}
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  {note.locked && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
                  {note.pinned && <span style={{ color: Y, fontSize: '0.7rem' }}>📌</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.85rem', letterSpacing: '0.02em', color: 'var(--color-text-primary)', paddingRight: '20px', lineHeight: 1.3, marginTop: note.tag_color ? '4px' : '0', wordBreak: 'break-word' }}>{note.title || 'Untitled'}</div>
                {/* Locked notes show no content */}
                {isLocked ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>🔒 Tap to unlock</div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>{pv(note.body) || 'Empty note'}</div>
                )}
                {note.category && (
                  <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 'var(--radius-pill)', background: (folderColor || 'var(--color-accent)') + '20', border: `1px solid ${folderColor || 'var(--color-accent)'}`, color: folderColor || 'var(--color-accent)', fontSize: '0.6rem', fontFamily: 'var(--font-head)', letterSpacing: '0.06em', alignSelf: 'flex-start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📁 {note.category}</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{isLocked ? '' : rt(note.body)}</span>
                  <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handlePin(note.id, !note.pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? Y : 'var(--color-text-muted)', padding: '3px', display: 'flex', alignItems: 'center', transition: 'color 150ms' }}><PinIcon size={11} /></button>
                    <button onClick={() => handleDelete(note.id)} className='btn-danger-hover' style={{ padding: '3px' }}><TrashIcon size={11} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button onClick={() => handleCreate(activeFolder || undefined)} style={{ position: 'fixed', bottom: '88px', right: '20px', width: '44px', height: '44px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#0A0A0F', fontWeight: 700, zIndex: 140 }}>+</button>
    </PageLayout>
  )
}
