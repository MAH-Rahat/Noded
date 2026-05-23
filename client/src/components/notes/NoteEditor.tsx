import React, { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

interface NoteEditorProps {
  noteId: string
  initialTitle: string
  initialBody: string
  initialTagLabel?: string | null
  initialTagColor?: string | null
  initialCategory?: string | null
  initialLocked?: boolean
  onClose: () => void
}

const TAG_COLORS = ['#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444', '#06B6D4', '#84CC16']
const TEXT_COLORS = ['#F1F5F9', '#F43F5E', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4']

export function NoteEditor({
  noteId, initialTitle, initialBody, initialTagLabel, initialTagColor,
  initialCategory, initialLocked, onClose,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [tagLabel, setTagLabel] = useState(initialTagLabel ?? '')
  const [tagColor, setTagColor] = useState(initialTagColor ?? TAG_COLORS[0])
  const [category, setCategory] = useState(initialCategory ?? '')
  const [locked, setLocked] = useState(initialLocked ?? false)
  const [saved, setSaved] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const didInit = useRef(false)

  // Store latest values in refs so the debounced save always reads fresh data
  const titleRef = useRef(title)
  const tagLabelRef = useRef(tagLabel)
  const tagColorRef = useRef(tagColor)
  const categoryRef = useRef(category)
  const lockedRef = useRef(locked)

  titleRef.current = title
  tagLabelRef.current = tagLabel
  tagColorRef.current = tagColor
  categoryRef.current = category
  lockedRef.current = locked

  // Initialize editor content once
  useEffect(() => {
    if (editorRef.current && !didInit.current) {
      didInit.current = true
      editorRef.current.innerHTML = initialBody || ''
    }
  }, [])

  const saveMutation = useMutation({
    mutationFn: (body: string) => api.patch(`/api/v1/notes/${noteId}`, {
      title: titleRef.current || 'Untitled',
      body,
      tag_label: tagLabelRef.current || null,
      tag_color: tagColorRef.current || null,
      category: categoryRef.current || null,
      locked: lockedRef.current,
    }),
    onSuccess: () => setSaved(true),
    onError: () => setSaved(true), // don't keep showing "Saving…" on error
  })

  function scheduleSave() {
    setSaved(false)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const body = editorRef.current?.innerHTML ?? ''
      saveMutation.mutate(body)
    }, 1200)
  }

  // Save when metadata changes (but not on first mount)
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    scheduleSave()
  }, [title, tagLabel, tagColor, category, locked])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(saveTimer.current) }
  }, [])

  function handleClose() {
    clearTimeout(saveTimer.current)
    const body = editorRef.current?.innerHTML ?? ''
    saveMutation.mutate(body)
    onClose()
  }

  function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value)
    editorRef.current?.focus()
    scheduleSave()
  }

  const btn = (active = false): React.CSSProperties => ({
    background: active ? 'var(--color-accent-dim)' : 'none',
    border: active ? '1px solid var(--color-accent)' : '1px solid transparent',
    borderRadius: '6px',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '4px 8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '28px',
    transition: 'all 150ms',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--color-bg)', zIndex: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', flexShrink: 0 }}>
        <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1.2rem', padding: '4px 8px', borderRadius: '6px' }}>←</button>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 700 }}
        />
        <span style={{ fontSize: '0.7rem', color: saved ? '#10B981' : 'var(--color-text-muted)', flexShrink: 0 }}>
          {saved ? '✓ Saved' : 'Saving…'}
        </span>
        <button onClick={() => setLocked(l => !l)} title={locked ? 'Unlock note' : 'Lock note'} style={{ ...btn(locked), fontSize: '1rem' }}>
          {locked ? '🔒' : '🔓'}
        </button>
      </div>

      {/* Formatting toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 16px', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', flexShrink: 0 }}>
        <button onClick={() => execCmd('bold')} style={btn()} title="Bold"><strong>B</strong></button>
        <button onClick={() => execCmd('italic')} style={btn()} title="Italic"><em>I</em></button>
        <button onClick={() => execCmd('underline')} style={{ ...btn(), textDecoration: 'underline' }} title="Underline">U</button>
        <button onClick={() => execCmd('strikeThrough')} style={{ ...btn(), textDecoration: 'line-through' }} title="Strike">S</button>
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 2px' }} />
        <button onClick={() => execCmd('insertUnorderedList')} style={btn()} title="Bullet list">• List</button>
        <button onClick={() => execCmd('insertOrderedList')} style={btn()} title="Numbered list">1. List</button>
        <button onClick={() => execCmd('insertHTML', '<input type="checkbox" style="margin-right:6px"> ')} style={btn()} title="Checklist">☑ Check</button>
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 2px' }} />
        {/* Font size */}
        <select
          onChange={e => { execCmd('fontSize', e.target.value) }}
          defaultValue="3"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '0.75rem', padding: '3px 6px', cursor: 'pointer', height: '28px' }}
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="5">XL</option>
          <option value="6">XXL</option>
        </select>
        {/* Text color */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowColorPicker(p => !p)} style={{ ...btn(), gap: '4px' }} title="Text color">
            <span>A</span>
            <div style={{ width: '12px', height: '3px', background: 'var(--color-accent)', borderRadius: '1px' }} />
          </button>
          {showColorPicker && (
            <div style={{ position: 'absolute', top: '34px', left: 0, zIndex: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap', width: '160px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              {TEXT_COLORS.map(c => (
                <button key={c} onClick={() => { execCmd('foreColor', c); setShowColorPicker(false) }}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 2px' }} />
        <button onClick={() => execCmd('removeFormat')} style={btn()} title="Clear formatting">✕</button>
      </div>

      {/* Meta bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Color:</span>
          {TAG_COLORS.map(c => (
            <button key={c} onClick={() => setTagColor(c)}
              style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: c, border: tagColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Tag:</span>
          <input value={tagLabel} onChange={e => setTagLabel(e.target.value)} placeholder="e.g. Work"
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', width: '80px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Category:</span>
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Education"
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', width: '100px' }} />
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleSave}
          style={{ minHeight: '60vh', outline: 'none', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '1rem', lineHeight: 1.8, caretColor: 'var(--color-accent)' }}
          data-placeholder="Start writing…"
        />
      </div>

      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: var(--color-text-muted); pointer-events: none; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 22px; }
        [contenteditable] li { margin: 4px 0; }
        [contenteditable] strong { font-weight: 700; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] a { color: var(--color-accent); }
        [contenteditable] input[type="checkbox"] { cursor: pointer; accent-color: var(--color-accent); width: 15px; height: 15px; }
      `}</style>
    </div>
  )
}
