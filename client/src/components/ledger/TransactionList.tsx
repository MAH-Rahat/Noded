import React from 'react'
import { Sparkline } from '../charts/Sparkline'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  date: string
  description?: string
  category?: string
  sparkData?: number[]
}

interface TransactionListProps {
  transactions: Transaction[]
  onDelete?: (id: string) => void
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (!transactions.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '8px',
            backgroundColor: tx.type === 'income'
              ? 'var(--color-income-tint)'
              : 'var(--color-expense-tint)',
          }}
        >
          {/* Type indicator */}
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
              flexShrink: 0,
            }}
          />

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tx.category || tx.description || '—'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{tx.date}</div>
          </div>

          {/* Sparkline */}
          {tx.sparkData && tx.sparkData.length > 1 && (
            <Sparkline
              data={tx.sparkData}
              color={tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'}
            />
          )}

          {/* Amount */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)',
              flexShrink: 0,
            }}
          >
            {tx.type === 'income' ? '+' : '-'}৳{Number(tx.amount).toLocaleString()}
          </span>

          {/* Delete */}
          {onDelete && (
            <button
              onClick={() => onDelete(tx.id)}
              aria-label="Delete transaction"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '2px',
                flexShrink: 0,
                fontSize: '0.75rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
