import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModuleCard } from '../layout/ModuleCard'
import { DonutChart } from '../charts/DonutChart'
import { BarChart } from '../charts/BarChart'
import { TransactionList } from './TransactionList'
import { BudgetProgressBar } from './BudgetProgressBar'
import { Skeleton, SkeletonBlock } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { useCountUp } from '../../hooks/useCountUp'
import api from '../../lib/api'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TRANSACTIONS, MOCK_CATEGORIES } from '../../lib/mockData'

const CATEGORY_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#06B6D4', '#F97316', '#84CC16',
]

export function LedgerCard() {
  const qc = useQueryClient()

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['ledger', 'summary'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_SUMMARY) : api.get('/api/v1/ledger/summary').then((r) => r.data.data),
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['ledger', 'transactions'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TRANSACTIONS) : api.get('/api/v1/ledger/transactions?page_size=10').then((r) => r.data.data),
  })

  const { data: catData } = useQuery({
    queryKey: ['ledger', 'categories'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_CATEGORIES) : api.get('/api/v1/ledger/categories').then((r) => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/ledger/transactions/${id}`),
    onSuccess: () => {
      setWriteError(null)
      qc.invalidateQueries({ queryKey: ['ledger'] })
    },
    onError: (err: Error) => {
      if (err.message === 'OFFLINE') setWriteError('Unavailable offline')
    },
  })

  const [writeError, setWriteError] = React.useState<string | null>(null)

  const balance = useCountUp(summaryData ? Number(summaryData.total_balance) : 0)
  const income = useCountUp(summaryData ? Number(summaryData.total_income) : 0)
  const expenses = useCountUp(summaryData ? Number(summaryData.total_expenses) : 0)

  const isLoading = summaryLoading || txLoading

  // Build donut data from categories
  const donutData = (catData || []).map((cat: any, i: number) => ({
    name: cat.name,
    value: 0, // will be enriched from transactions in a real impl
    color: cat.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    overBudget: false,
  }))

  // Build bar data from monthly summary
  const barData = (summaryData?.monthly || []).map((m: any) => ({
    month: m.month.slice(5), // "MM"
    income: Number(m.income),
    expenses: Number(m.expenses),
  }))

  const transactions = (txData?.items || []).map((tx: any) => ({
    id: tx.id,
    amount: tx.amount,
    type: tx.type,
    date: tx.date,
    description: tx.description,
    category: (catData || []).find((c: any) => c.id === tx.category_id)?.name,
  }))

  const exportMenu = (
    <a
      href={`${import.meta.env.VITE_API_URL}/api/v1/ledger/export`}
      download="transactions.csv"
      style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textDecoration: 'none' }}
    >
      Export CSV
    </a>
  )

  return (
    <ModuleCard title="The Ledger" headerAction={exportMenu}>
      {writeError && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginBottom: '8px' }}>{writeError}</div>
      )}
      {isLoading ? (
        <SkeletonBlock lines={5} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary stats */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            {[
              { label: 'Balance', value: balance, color: 'var(--color-text-primary)' },
              { label: 'Income', value: income, color: 'var(--color-success)' },
              { label: 'Expenses', value: expenses, color: 'var(--color-danger)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color }}>
                  ৳{value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {barData.length > 0 && <BarChart data={barData} />}
          {donutData.length > 0 && <DonutChart data={donutData} />}

          {/* Transactions */}
          {transactions.length > 0 ? (
            <TransactionList
              transactions={transactions}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ) : (
            <EmptyState message="No transactions yet" />
          )}
        </div>
      )}
    </ModuleCard>
  )
}
