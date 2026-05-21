import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '../../stores/uiStore'
import api from '../../lib/api'

interface SearchResult {
  id: string
  title: string
  type: 'note' | 'task' | 'transaction'
  state?: string
  date?: string
  tag_label?: string | null
}

interface SearchResults {
  notes: SearchResult[]
  tasks: SearchResult[]
  transactions: SearchResult[]
}

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      setResults(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  // Keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchOpen ? closeSearch() : useUIStore.getState().openSearch()
      }
      if (e.key === 'Escape' && searchOpen) closeSearch()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen, closeSearch])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/v1/search?q=${encodeURIComponent(query)}`)
        setResults(res.data.data)
      } catch { setResults(null) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (!searchOpen) return null

  const hasResults = results && (results.notes.length + results.tasks.length + results.transactions.length) > 0

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 'var(--z-overlay)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        padding: '80px 16px 16px',
      }}
      onClick={closeSearch}
    >
      <div
        className="slide-up"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, tasks, transactions…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.95rem',
            }}
          />
          <kbd style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: '4px' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Searching…
            </div>
          )}

          {!loading && query && !hasResults && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No results for "{query}"
            </div>
          )}

          {!loading && hasResults && results && (
            <>
              {results.notes.length > 0 && (
                <ResultSection title="Notes" items={results.notes} onClose={closeSearch} />
              )}
              {results.tasks.length > 0 && (
                <ResultSection title="Tasks" items={results.tasks} onClose={closeSearch} />
              )}
              {results.transactions.length > 0 && (
                <ResultSection title="Transactions" items={results.transactions} onClose={closeSearch} />
              )}
            </>
          )}

          {!query && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              Type to search across all your content
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function ResultSection({ title, items, onClose }: { title: string; items: SearchResult[]; onClose: () => void }) {
  return (
    <div>
      <div style={{ padding: '8px 16px 4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 16px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
            borderBottom: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span style={{ fontSize: '0.9rem' }}>
            {item.type === 'note' ? '📝' : item.type === 'task' ? '✅' : '💰'}
          </span>
          <span style={{ flex: 1 }}>{item.title}</span>
          {item.state && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item.state}</span>
          )}
        </button>
      ))}
    </div>
  )
}
