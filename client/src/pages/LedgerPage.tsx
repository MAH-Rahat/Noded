import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { DonutChart } from '../components/charts/DonutChart'
import { BarChart } from '../components/charts/BarChart'
import { TransactionList } from '../components/ledger/TransactionList'
import { BudgetProgressBar } from '../components/ledger/BudgetProgressBar'
import { useCountUp } from '../hooks/useCountUp'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TRANSACTIONS, MOCK_CATEGORIES } from '../lib/mockData'
import api from '../lib/api'

const CATEGORY_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#06B6D4','#F97316','#84CC16']

export default function LedgerPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ amount: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0] })

  const { data: summary } = useQuery({
    queryKey: ['ledger', 'summary'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_SUMMARY) : api.get('/api/v1/ledger/summary').then(r => r.data.data),
  })
  const { data: txData } = useQuery({
    queryKey: ['ledger', 'transactions'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TRANSACTIONS) : api.get('/api/v1/ledger/transactions?page_size=50').then(r => r.data.data),
  })
  const { data: cats = [] } = useQuery<any[]>({
    queryKey: ['ledger', 'categories'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_CATEGORIES) : api.get('/api/v1/ledger/categories').then(r => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/ledger/transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }),
  })

  const balance = useCountUp(summary ? Number(summary.total_balance) : 0)
  const income = useCountUp(summary ? Number(summary.total_income) : 0)
  const expenses = useCountUp(summary ? Number(summary.total_expenses) : 0)

  const barData = (summary?.monthly || []).map((m: any) => ({
    month: m.month.slice(5),
    income: Number(m.income),
    expenses: Number(m.expenses),
  }))

  const donutData = cats.map((c: any, i: number) => ({
    name: c.name,
    value: (txData?.items || []).filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0),
    color: c.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    overBudget: c.budget_limit && (txData?.items || []).filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0) > Number(c.budget_limit),
  })).filter((d: any) => d.value > 0)

  const transactions = (txData?.items || []).map((tx: any) => ({
    id: tx.id, amount: tx.amount, type: tx.type, date: tx.date,
    description: tx.description,
    category: cats.find((c: any) => c.id === tx.category_id)?.name,
  }))

  return (
    <PageLayout title="Ledger">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Balance', value: balance, color: 'var(--color-accent)' },
          { label: 'Income', value: income, color: 'var(--color-success)' },
          { label: 'Expenses', value: expenses, color: 'var(--color-danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'rgba(26,28,35,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color, marginTop: '4px' }}>৳{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <Section title="Monthly Overview">
        <BarChart data={barData} />
      </Section>

      <Section title="Spending by Category">
        {donutData.length > 0 ? <DonutChart data={donutData} /> : <Empty text="No expense data yet" />}
      </Section>

      {/* Budget progress */}
      {cats.filter((c: any) => c.budget_limit).length > 0 && (
        <Section title="Budget Limits">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cats.filter((c: any) => c.budget_limit).map((c: any) => {
              const spent = (txData?.items || []).filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
              return <BudgetProgressBar key={c.id} label={c.name} spent={spent} limit={Number(c.budget_limit)} />
            })}
          </div>
        </Section>
      )}

      {/* Add transaction */}
      <Section title="Add Transaction">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['expense', 'income'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                borderColor: form.type === t ? 'var(--color-accent)' : 'var(--color-border)',
                background: form.type === t ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: form.type === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
          <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount (৳)" type="number" style={inputStyle} />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" style={inputStyle} />
          <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" style={inputStyle} />
          <button style={{ padding: '10px', borderRadius: '8px', background: 'var(--color-accent)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            + Add {form.type}
          </button>
        </div>
      </Section>

      {/* Transactions */}
      <Section title={`Transactions (${transactions.length})`} action={
        <a href={`${import.meta.env.VITE_API_URL}/api/v1/ledger/export`} download style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none' }}>Export CSV</a>
      }>
        {transactions.length > 0
          ? <TransactionList transactions={transactions} onDelete={id => deleteMutation.mutate(id)} />
          : <Empty text="No transactions yet" />}
      </Section>
    </PageLayout>
  )
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{title}</h2>
        {action}
      </div>
      <div style={{ background: 'rgba(26,28,35,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
        {children}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0', margin: 0 }}>{text}</p>
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'var(--color-surface)',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none',
  boxSizing: 'border-box',
}
