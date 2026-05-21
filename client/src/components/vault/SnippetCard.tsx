import React, { useState } from 'react'
import { Badge } from '../ui/Badge'

interface SnippetCardProps {
  id: string
  label: string
  content: string
  snippet_type: 'api_key' | 'password' | 'personal_id'
  category_label?: string | null
  onDelete: (id: string) => void
}

const TYPE_ICONS: Record<string, string> = {
  api_key: '🔑',
  password: '🔒',
  personal_id: '🪪',
}

const TYPE_LABELS: Record<string, string> = {
  api_key: 'API Key',
  password: 'Password',
  personal_id: 'Personal ID',
}

export function SnippetCard({ id, label, content, snippet_type, category_label, onDelete }: SnippetCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-2)',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1rem' }}>{TYPE_ICONS[snippet_type] ?? '📄'}</span>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', flex: 1 }}>
          {label}
        </span>
        <Badge variant="default">{TYPE_LABELS[snippet_type]}</Badge>
      </div>

      {/* Category */}
      {category_label && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{category_label}</span>
      )}

      {/* Content */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: revealed ? 'var(--color-text-primary)' : 'transparent',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '6px',
          padding: '8px 10px',
          wordBreak: 'break-all',
          textShadow: revealed ? 'none' : '0 0 8px var(--color-text-muted)',
          filter: revealed ? 'none' : 'blur(4px)',
          userSelect: revealed ? 'text' : 'none',
          transition: 'filter 200ms',
          minHeight: '36px',
        }}
      >
        {content}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => setRevealed((r) => !r)}
          style={{
            flex: 1,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '5px',
          }}
        >
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            background: copied ? 'var(--color-success)' : 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: copied ? '#fff' : 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '5px',
            transition: 'background 200ms',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button
          onClick={() => onDelete(id)}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-danger)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '5px 8px',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
