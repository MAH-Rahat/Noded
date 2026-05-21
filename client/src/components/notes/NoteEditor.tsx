import React, { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import api from '../../lib/api'

interface NoteEditorProps {
  noteId: string
  initialTitle: string
  initialBody: string
  initialTagLabel?: string | null
  initialTagColor?: string | null
  onClose: () => void
}

const TAG_COLORS = ['#3B82F6', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444']

export function NoteEditor({
  noteId,
  initialTitle,
  initialBody,
  initialTagLabel,
  initialTagColor,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [tagLabel, setTagLabel] = useState(initialTagLabel ?? '')
  const [tagColor, setTagColor] = useState(initialTagColor ?? TAG_COLORS[0])
  const [preview, setPreview] = useState(false)
  const [saved, setSaved] = useState(true)

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/v1/notes/${noteId}`, {
        title: title || 'Untitled',
        body,
        tag_label: tagLabel || null,
        tag_color: tagColor || null,
      }),
    onSuccess: () => setSaved(true),
  })

  // Debounced auto-save
  useEffect(() => {
    setSaved(false)
    const timer = setTimeout(() => saveMutation.mutate(), 1200)
    return () => clearTimeout(timer)
  }, [title, body, tagLabel, tagColor])

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-bg)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: '1rem', padding: '4px',
          }}
          aria-label="Close editor"
        >
          ←
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-ui)',
            fontSize: '1rem',
            fontWeight: 700,
          }}
        />

        {/* Save indicator */}
        <span style={{ fontSize: '0.7rem', color: saved ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {saved ? '✓ Saved' : 'Saving…'}
        </span>

        {/* Preview toggle */}
        <button
          onClick={() => setPreview((p) => !p)}
          style={{
            background: preview ? 'var(--color-accent)' : 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: preview ? '#fff' : 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '4px 10px',
          }}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Tag bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tag:</span>
        <input
          value={tagLabel}
          onChange={(e) => setTagLabel(e.target.value)}
          placeholder="Label"
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem', width: '100px',
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setTagColor(c)}
              style={{
                width: '14px', height: '14px', borderRadius: '50%',
                backgroundColor: c, border: tagColor === c ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer', padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Editor / Preview */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
        {preview ? (
          <div
            style={{
              color: 'var(--color-text-primary)',
              lineHeight: 1.7,
              fontSize: '0.95rem',
            }}
            className="markdown-preview"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Start writing in Markdown…"
            style={{
              width: '100%',
              minHeight: '60vh',
              background: 'none',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              lineHeight: 1.7,
            }}
          />
        )}
      </div>

      {/* Markdown preview styles */}
      <style>{`
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3 {
          color: var(--color-text-primary);
          margin: 1em 0 0.5em;
        }
        .markdown-preview p { margin: 0.5em 0; }
        .markdown-preview code {
          font-family: var(--font-mono);
          background: var(--color-surface-2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .markdown-preview pre {
          background: var(--color-surface-2);
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
        }
        .markdown-preview pre code { background: none; padding: 0; }
        .markdown-preview blockquote {
          border-left: 3px solid var(--color-accent);
          padding-left: 12px;
          color: var(--color-text-muted);
          margin: 0.5em 0;
        }
        .markdown-preview a { color: var(--color-accent); }
        .markdown-preview ul, .markdown-preview ol { padding-left: 20px; }
        .markdown-preview li { margin: 0.25em 0; }
        .markdown-preview hr { border-color: var(--color-border); }
      `}</style>
    </div>
  )
}
