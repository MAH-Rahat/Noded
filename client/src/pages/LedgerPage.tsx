import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useCountUp } from '../hooks/useCountUp'
import { TrendingUpIcon, PlusIcon, DownloadIcon, TrashIcon } from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TRANSACTIONS, MOCK_CATEGORIES } from '../lib/mockData'
import api from '../lib/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#F43F5E','#06B6D4','#84CC16','#EC4899']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(13,16,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', backdropFilter: 'blur(20px)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: p.color, fontWeight: 600 }}>
          {p.name}: ৳{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function LedgerPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview'|'transactions'|'add'>('overview')
  const [form, setForm] = useState({ amount: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0], category_id: '' })

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

  const areaData = (summary?.monthly || []).map((m: any) => ({
    month: m.month.slice(5),
    income: Number(m.income),
    expenses: Number(m.expenses),
    net: Number(m.income) - Number(m.expenses),
  }))

  const donutData = cats.map((c: any, i: number) => {
    const spent = (txData?.items || []).filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
    return { name: c.name, value: spent, color: c.color || COLORS[i % COLORS.length] }
  }).filter((d: any) => d.value > 0)

  const transactions = (txData?.items || []).map((tx: any) => ({
    ...tx,
    categoryName: cats.find((c: any) => c.id === tx.category_id)?.name || '—',
  }))

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: `Transactions (${transactions.length})` },
    { id: 'add', label: '+ Add' },
  ]

  return (
    <PageLayout title="Ledger">
      {/* Hero stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Net Balance', value: balance, color: '#3B82F6', glow: 'rgba(59,130,246,0.15)', prefix: '৳' },
          { label: 'Total Income', value: income, color: '#10B981', glow: 'rgba(16,185,129,0.12)', prefix: '৳' },
          { label: 'Total Spent', value: expenses, color: '#F43F5E', glow: 'rgba(244,63,94,0.12)', prefix: '৳' },
        ].map(({ label, value, color, glow, prefix }) => (
          <div key={label} className="glass-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', borderRadius: '50%', background: glow, filter: 'blur(20px)', pointerEvents: 'none' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700, color, letterSpacing: '-0.02em' }}>
              {prefix}{value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            flex: 1, padding: '8px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            background: activeTab === t.id ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: activeTab === t.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600,
            transition: 'all 200ms',
            boxShadow: activeTab === t.id ? '0 0 12px rgba(59,130,246,0.15)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Area chart */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Monthly Cash Flow</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#F43F5E" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut + bar side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>By Category</div>
              {donutData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                        {donutData.map((d: any, i: number) => <Cell key={i} fill={d.color} stroke="rgba(8,10,15,0.8)" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                    {donutData.slice(0, 3).map((d: any) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>৳{Number(d.value).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>No data</p>}
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Monthly Bars</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={areaData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Income" fill="#10B981" radius={[4,4,0,0]} fillOpacity={0.85} />
                  <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[4,4,0,0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget limits */}
          {cats.filter((c: any) => c.budget_limit).length > 0 && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Budget Limits</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {cats.filter((c: any) => c.budget_limit).map((c: any, i: number) => {
                  const spent = (txData?.items || []).filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
                  const pct = Math.min((spent / Number(c.budget_limit)) * 100, 100)
                  const isOver = pct >= 100
                  const isWarn = pct >= 80 && !isOver
                  const barColor = isOver ? '#F43F5E' : isWarn ? '#F59E0B' : COLORS[i % COLORS.length]
                  return (
                    <div key={c.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{c.name}</span>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: isOver ? '#F43F5E' : 'var(--color-text-muted)' }}>
                          ৳{spent.toLocaleString()} / ৳{Number(c.budget_limit).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px', transition: 'width 600ms ease-out', boxShadow: `0 0 8px ${barColor}60` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>All Transactions</span>
            <a href={`${import.meta.env.VITE_API_URL}/api/v1/ledger/export`} download style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
              <DownloadIcon size={13} /> Export CSV
            </a>
          </div>
          {transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No transactions yet</div>
          ) : (
            transactions.map((tx: any, i: number) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: tx.type === 'income' ? 'rgba(16,185,129,0.03)' : 'rgba(244,63,94,0.03)',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: tx.type === 'income' ? '#10B981' : '#F43F5E',
                  boxShadow: `0 0 6px ${tx.type === 'income' ? '#10B98160' : '#F43F5E60'}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>{tx.description || tx.categoryName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{tx.categoryName} · {tx.date}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: tx.type === 'income' ? '#10B981' : '#F43F5E' }}>
                  {tx.type === 'income' ? '+' : '-'}৳{Number(tx.amount).toLocaleString()}
                </div>
                <button onClick={() => deleteMutation.mutate(tx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#F43F5E'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add tab */}
      {activeTab === 'add' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>New Transaction</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Type toggle */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {['expense', 'income'].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid',
                  borderColor: form.type === t ? (t === 'income' ? '#10B981' : '#F43F5E') : 'rgba(255,255,255,0.08)',
                  background: form.type === t ? (t === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)') : 'rgba(255,255,255,0.03)',
                  color: form.type === t ? (t === 'income' ? '#10B981' : '#F43F5E') : 'var(--color-text-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize',
                  transition: 'all 200ms',
                }}>{t}</button>
              ))}
            </div>
            {[
              { key: 'amount', placeholder: 'Amount (৳)', type: 'number' },
              { key: 'description', placeholder: 'Description', type: 'text' },
              { key: 'date', placeholder: 'Date', type: 'date' },
            ].map(({ key, placeholder, type }) => (
              <input key={key} type={type} placeholder={placeholder} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as any }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
              />
            ))}
            <button style={{ padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.3)', transition: 'transform 150ms' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Add {form.type}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
