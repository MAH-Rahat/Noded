import React from 'react'

interface NoteCardProps {
  id: string
  title: string
  body: string
  tagLabel?: string | null
  tagColor?: string | null
  pinned: boolean
  pinnedCount: number
  onOpen: (id: string) => void
  onPin: (id: string) => void
  onDelete: (id: string) => void
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function readingTime(text: string) {
  const wpm = 200
  const mins = Math.ceil(wordCount(text) / wpm)
  return mins < 1 ? '<1 min' : `${mins} min`
}

function preview(body: string) {
  return body.split('\n').slice(0, 2).join(' ').slice(0, 100)
}

export function NoteCard({
  id, title, body, tagLabel, tagColor, pinned, pinnedCount, onOpen, onPin, onDelete,
}: NoteCardProps) {
  const atPinLimit = pinnedCount >= 3 && !pinned

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-2)',
        borderRadius: '10px',
        border: `1px solid ${pinned ? 'var(--color-accent)' : 'var(--color-border)'}`,
        padding: '12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'relative',
      }}
      onClick={() => onOpen(id)}
    >
      {/* Pin icon */}
      {pinned && (
        <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.75rem' }}>📌</span>
      )}

      {/* Title */}
      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', paddingRight: '20px' }}>
        {title || 'Untitled'}
      </div>

      {/* Preview */}
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
        {preview(body) || 'Empty note'}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Tag dot */}
          {tagColor && (
            <span
              title={tagLabel ?? ''}
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: tagColor, flexShrink: 0,
              }}
            />
          )}
          {/* Word count + read time */}
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
            {wordCount(body)} words · {readingTime(body)}
          </span>
        </div>

        {/* Actions */}
        <div
          style={{ display: 'flex', gap: '6px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              if (atPinLimit) {
                alert('Pin limit reached. Unpin a note first.')
                return
              }
              onPin(id)
            }}
            title={pinned ? 'Unpin' : atPinLimit ? 'Pin limit reached' : 'Pin'}
            style={{
              background: 'none', border: 'none', cursor: atPinLimit ? 'not-allowed' : 'pointer',
              color: pinned ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontSize: '0.75rem', padding: '2px',
              opacity: atPinLimit ? 0.4 : 1,
            }}
          >
            📌
          </button>
          <button
            onClick={() => onDelete(id)}
            title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '2px' }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
