import React, { useState, useMemo } from 'react'
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
  created_at?: string; updated_at?: string
}
interface Folder { name: string; color: string }

const Y = 'var(--color-accent)'
const FOLDER_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#06B6D4', '#F43F5E', '#84CC16']
const NOTES_PIN_KEY = 'noded_notes_pin'

function getPin() { return localStorage.getItem(NOTES_PIN_KEY) || '' }

function wc(t: string) { return t.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length }
function rt(t: string) { const m = Math.ceil(wc(t) / 200); return m < 1 ? '<1m' : m + 'm' }
function pv(body: string) {
  return body.replace(/<[^>]*>/g, '').replace(/[#*`>]/g, '').split('\n').filter((l: string) => l.trim()).slice(0, 2).join(' ').slice(0, 80)
}

// ── PIN modal (unlock a locked note) ─────────────────────────────────────────
function PinModal({ onUnlock, onCancel }: { onUnlock: () => void; onCancel: () => void }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const stored = getPin()
    if (!stored) { alert('No PIN set. Please set a PIN in Settings first.'); onCancel(); return }
    if (pin === stored) { onUnlock() }
    else { setErr('Wrong PIN'); setPin('') }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', width: '280px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Protected Note</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Enter your notes PIN to view</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter PIN" autoFocus inputMode="numeric"
            style={{ padding: '10px', background: 'var(--color-surface)', border: `1px solid ${err ? '#F43F5E' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '1rem', outline: 'none', textAlign: 'center', letterSpacing: '0.3em' }} />
          {err && <div style={{ fontSize: '0.75rem', color: '#F43F5E' }}>{err}</div>}
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
  const [openFolder, setOpenFolder] = useState<string | null>(null) // null = root view
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'folder'>('date')
  const [showSortMenu, setShowSortMenu] = useState(false)
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
    mutationFn: (cat: string | null) => api.post('/api/v1/notes', { title: 'Untitled', body: '', category: cat }),
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

  function saveFolders(f: Folder[]) { setFolders(f); localStorage.setItem('note_folders', JSON.stringify(f)) }

  function handleCreate() {
    const cat = openFolder // create note in current folder
    if (IS_PREVIEW) {
      const id = 'pn-' + Date.now()
      setPreviewNotes(p => [{ id, title: 'Untitled', body: '', pinned: false, category: cat }, ...p])
      setEditingId(id)
    } else {
      createMutation.mutate(cat)
    }
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
    if (note.locked && !unlockedIds.has(note.id)) {
      if (!getPin()) { alert('No PIN set. Go to Settings → Security to set your notes PIN.'); return }
      setUnlockingId(note.id)
      return
    }
    setEditingId(note.id)
  }

  function handleUnlock() {
    if (unlockingId) {
      setUnlockedIds(prev => new Set([...prev, unlockingId]))
      setEditingId(unlockingId)
      setUnlockingId(null)
    }
  }

  function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    saveFolders([...folders, { name: newFolderName.trim(), color: newFolderColor }])
    setNewFolderName('')
    setShowFolderForm(false)
  }

  // Notes in current view
  const visibleNotes = useMemo(() => {
    let list = notes.filter(n => {
      if (openFolder !== null) return n.category === openFolder
      return true // root: show all notes without a folder + folders
    })
    if (search) list = list.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))
    if (sortBy === 'name') list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    else if (sortBy === 'folder') list = [...list].sort((a, b) => (a.category || '').localeCompare(b.category || ''))
    else list = [...list].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    return list
  }, [notes, openFolder, search, sortBy])

  // Root view: show folders + notes without a folder
  const rootNotes = openFolder === null ? visibleNotes.filter(n => !n.category || !folders.find(f => f.name === n.category)) : visibleNotes
  const folderColor = (name: string) => folders.find(f => f.name === name)?.color || Y

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

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)', padding: '12px', cursor: 'pointer',
    position: 'relative', display: 'flex', flexDirection: 'column',
    gap: '6px', minHeight: '130px', transition: 'border-color 150ms, background 150ms', overflow: 'hidden',
  }

  return (
    <PageLayout>
      {unlockingId && <PinModal onUnlock={handleUnlock} onCancel={() => setUnlockingId(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          {openFolder !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setOpenFolder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.2rem', padding: '0 4px' }}>←</button>
              <div>
                <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', letterSpacing: '0.04em', color: folderColor(openFolder), lineHeight: 1 }}>📁 {openFolder}</h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>{visibleNotes.length} notes</p>
              </div>
            </div>
          ) : (
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2.2rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1 }}>CANVAS</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>{notes.length} notes · {folders.length} folders</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href={import.meta.env.VITE_API_URL + '/api/v1/notes/export'} download style={{ padding: '8px 10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}><DownloadIcon size={15} /></a>
          <button onClick={handleCreate} style={{ padding: '8px 14px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#0A0A0F', display: 'flex', alignItems: 'center', gap: '4px' }}><PlusIcon size={14} /> NEW NOTE</button>
        </div>
      </div>

      {/* Search + Sort */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search notes...' className='input-field' style={{ flex: 1 }} />
        {/* Sort dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowSortMenu(s => !s)} style={{ padding: '10px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
            Sort: {sortBy === 'date' ? '📅 Date' : sortBy === 'name' ? '🔤 Name' : '📁 Folder'} ▾
          </button>
          {showSortMenu && (
            <div style={{ position: 'absolute', right: 0, top: '44px', zIndex: 50, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', minWidth: '140px', boxShadow: 'var(--glass-shadow)' }}>
              {[{ key: 'date', label: '📅 By Date' }, { key: 'name', label: '🔤 By Name' }, { key: 'folder', label: '📁 By Folder' }].map(({ key, label }) => (
                <button key={key} onClick={() => { setSortBy(key as any); setShowSortMenu(false) }} style={{ display: 'block', width: '100%', padding: '10px 14px', background: sortBy === key ? 'var(--color-accent-dim)' : 'none', border: 'none', cursor: 'pointer', color: sortBy === key ? 'var(--color-accent)' : 'var(--color-text-primary)', fontSize: '0.82rem', textAlign: 'left' }}>{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Root view: folders + new folder button + notes without folder */}
      {openFolder === null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {/* Existing folders */}
          {folders.map(f => {
            const count = notes.filter(n => n.category === f.name).length
            return (
              <div key={f.name} style={{ ...cardStyle, border: `1px solid ${f.color}40`, background: f.color + '10' }}
                onClick={() => setOpenFolder(f.name)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.background = f.color + '20' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = f.color + '40'; e.currentTarget.style.background = f.color + '10' }}
              >
                <div style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '4px' }}>📁</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: f.color, wordBreak: 'break-word' }}>{f.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 'auto' }}>{count} note{count !== 1 ? 's' : ''}</div>
                <button onClick={e => { e.stopPropagation(); saveFolders(folders.filter(x => x.name !== f.name)) }}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.7rem', padding: '2px 5px', borderRadius: '4px' }}>✕</button>
              </div>
            )
          })}
          {/* New folder card */}
          {!showFolderForm ? (
            <div style={{ ...cardStyle, border: '1px dashed var(--color-border)', background: 'transparent', alignItems: 'center', justifyContent: 'center', minHeight: '130px' }}
              onClick={() => setShowFolderForm(true)}>
              <div style={{ fontSize: '2rem', opacity: 0.4 }}>📁</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>+ New Folder</div>
            </div>
          ) : (
            <form onSubmit={handleCreateFolder} style={{ ...cardStyle, justifyContent: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
              <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name" className="input-field" style={{ fontSize: '0.85rem', padding: '7px 10px' }} />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {FOLDER_COLORS.map(c => <button key={c} type="button" onClick={() => setNewFolderColor(c)} style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, border: newFolderColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />)}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '6px', borderRadius: '8px', fontSize: '0.75rem' }}>Create</button>
                <button type="button" onClick={() => setShowFolderForm(false)} style={{ padding: '6px 10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>✕</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Notes grid */}
      {(openFolder !== null ? visibleNotes : rootNotes).length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px 20px' }}>
          <svg width='48' height='48' viewBox='0 0 48 48' fill='none' style={{ opacity: 0.2 }}><circle cx='24' cy='24' r='22' stroke='var(--color-text-muted)' strokeWidth='2' /><path d='M2 24 H46' stroke='var(--color-text-muted)' strokeWidth='2' /><circle cx='24' cy='24' r='6' stroke='var(--color-text-muted)' strokeWidth='2' fill='var(--color-surface)' /></svg>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{search ? 'No notes matching that search.' : openFolder ? 'No notes in this folder yet.' : 'No notes yet.'}</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
          {(openFolder !== null ? visibleNotes : rootNotes).map(note => {
            const isLocked = note.locked && !unlockedIds.has(note.id)
            const fc = note.category ? folderColor(note.category) : null
            return (
              <div key={note.id}
                style={{ ...cardStyle, border: `1px solid ${fc ? fc + '40' : 'var(--glass-border)'}` }}
                onClick={() => handleNoteClick(note)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = fc || Y; e.currentTarget.style.background = 'var(--glass-bg-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = fc ? fc + '40' : 'var(--glass-border)'; e.currentTarget.style.background = 'var(--glass-bg)' }}
              >
                {note.tag_color && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: note.tag_color, borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }} />}
                <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                  {note.locked && <span style={{ fontSize: '0.7rem' }}>🔒</span>}
                  {note.pinned && <span style={{ color: Y, fontSize: '0.7rem' }}>📌</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)', paddingRight: '20px', lineHeight: 1.3, marginTop: note.tag_color ? '4px' : '0', wordBreak: 'break-word' }}>{note.title || 'Untitled'}</div>
                {isLocked ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>🔒 Tap to unlock</div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>{pv(note.body) || 'Empty note'}</div>
                )}
                {note.category && openFolder === null && (
                  <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 'var(--radius-pill)', background: (fc || Y) + '20', border: `1px solid ${fc || Y}`, color: fc || Y, fontSize: '0.6rem', fontWeight: 600, alignSelf: 'flex-start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📁 {note.category}</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{isLocked ? '' : rt(note.body)}</span>
                  <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handlePin(note.id, !note.pinned)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? Y : 'var(--color-text-muted)', padding: '3px', display: 'flex', alignItems: 'center' }}><PinIcon size={11} /></button>
                    <button onClick={() => handleDelete(note.id)} className='btn-danger-hover' style={{ padding: '3px' }}><TrashIcon size={11} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <button onClick={handleCreate} style={{ position: 'fixed', bottom: '88px', right: '20px', width: '44px', height: '44px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#0A0A0F', fontWeight: 700, zIndex: 140 }}>+</button>
    </PageLayout>
  )
}