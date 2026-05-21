import React, { useState } from 'react'

interface TaskRowProps {
  id: string
  title: string
  state: 'pending' | 'completed' | 'delayed'
  dueTime?: string | null
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskRow({ id, title, state, dueTime, onToggle, onDelete }: TaskRowProps) {
  const [animating, setAnimating] = useState(false)
  const isCompleted = state === 'completed'
  const isDelayed = state === 'delayed'

  function handleToggle() {
    if (!animating) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 400)
    }
    onToggle(id)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 4px',
        borderBottom: '1px solid var(--color-border)',
        opacity: isDelayed ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '5px',
          border: `2px solid ${isCompleted ? 'var(--color-accent)' : 'var(--color-border)'}`,
          backgroundColor: isCompleted ? 'var(--color-accent)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 150ms, border-color 150ms',
        }}
      >
        {isCompleted && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M2 6l3 3 5-5"
              className={animating ? 'checkmark-path' : ''}
            />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        style={{
          flex: 1,
          fontSize: '0.875rem',
          color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          textDecoration: isCompleted ? 'line-through' : 'none',
          transition: 'color 150ms',
        }}
      >
        {title}
        {isDelayed && (
          <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--color-warning)' }}>
            delayed
          </span>
        )}
      </span>

      {/* Due time */}
      {dueTime && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <ClockIcon />
          {new Date(dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(id)}
        aria-label="Delete task"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
          padding: '2px',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
