import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useCountUp } from '../hooks/useCountUp'
import { TrashIcon, DownloadIcon } from '../components/ui/Icons'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TRANSACTIONS, MOCK_CATEGORIES } from '../lib/mockData'
import api from '../lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const Y = "var(--color-accent)"
const MINT = '#00E5A0'
const RED = '#FF4444'
const MUTED = '#5A5A72'
const PIE_COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F43F5E', '#84CC16', '#F97316', '#A855F7']
const CAT_COLORS: Record<string, string> = { Food: '#F59E0B', Transport: '#3D6BFF', Education: '#8B5CF6', Utilities: '#06B6D4', Personal: '#EC4899', Income: '#00E5A0' }

function EmptyTrainer() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '32px 20px' }}>
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.2 }}>
        <circle cx="24" cy="24" r="22" stroke="var(--color-text-muted)" strokeWidth="2" />
        <path d="M2 24 H46" stroke="var(--color-text-muted)" strokeWidth="2" />
        <circle cx="24" cy="24" r="6" stroke="var(--color-text-muted)" strokeWidth="2" fill="var(--color-surface)" />
      </svg>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nothing here, Trainer.</span>
    </div>
  )
}

function CategoryBar({ name, spent, budget, color }: { name: string; spent: number; budget: number | null; color: string }) {
  const pct = budget ? Math.min((spent / budget) * 100, 100) : 0
  const isOver = pct >= 100; const isWarn = pct >= 80 && !isOver
  const barColor = isOver ? RED : isWarn ? '#F59E0B' : Y
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>{name}</span>
          <span style={{ padding: '1px 5px', borderRadius: 'var(--radius-pill)', border: '1px solid ' + MUTED, color: MUTED, background: MUTED + '10', fontFamily: 'var(--font-head)', fontSize: '0.5rem', letterSpacing: '0.06em' }}>SPEND</span>
        </div>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>BDT {spent.toLocaleString()}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div className="hp-bar-track">
          <div className={'hp-bar-fill' + (isOver ? ' warn' : isWarn ? ' caution' : '')} style={{ width: (budget ? pct : 0) + '%', background: barColor }} />
        </div>
        {budget && <span style={{ position: 'absolute', right: 0, top: '-16px', fontFamily: 'var(--font-pixel)', fontSize: '0.45rem', color: barColor }}>{Math.round(pct)}%</span>}
      </div>
    </div>
  )
}

export default function LedgerPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budget'>('overview')
  const [showAdd, setShowAdd] = useState(false)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [quickCat, setQuickCat] = useState<string | null>(null)
  const [form, setForm] = useState({ amount: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0], category_id: '' })
  const [addSuccess, setAddSuccess] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', color: 'var(--color-accent)', budget_limit: '' })
  const [editCat, setEditCat] = useState<any | null>(null)
  const [catMsg, setCatMsg] = useState('')

  const { data: summary } = useQuery({ queryKey: ['ledger', 'summary'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_SUMMARY) : api.get('/api/v1/ledger/summary').then(r => r.data.data) })
  const { data: txData } = useQuery({ queryKey: ['ledger', 'transactions'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TRANSACTIONS) : api.get('/api/v1/ledger/transactions?page_size=50').then(r => r.data.data) })
  const { data: cats = [] } = useQuery<any[]>({ queryKey: ['ledger', 'categories'], queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_CATEGORIES) : api.get('/api/v1/ledger/categories').then(r => r.data.data) })

  const deleteTxMutation = useMutation({ mutationFn: (id: string) => api.delete('/api/v1/ledger/transactions/' + id), onSuccess: () => qc.invalidateQueries({ queryKey: ['ledger'] }) })
  const createTxMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/api/v1/ledger/transactions', { amount: Number(data.amount), type: data.type, description: data.description, date: data.date, category_id: data.category_id || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ledger'] }); setForm({ amount: '', type: 'expense', description: '', date: new Date().toISOString().split('T')[0], category_id: '' }); setShowAdd(false); setQuickCat(null); setAddSuccess(true); setTimeout(() => setAddSuccess(false), 2500) },
  })
  const createCatMutation = useMutation({
    mutationFn: () => api.post('/api/v1/ledger/categories', { name: catForm.name, color: catForm.color, budget_limit: catForm.budget_limit ? Number(catForm.budget_limit) : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ledger', 'categories'] }); setCatForm({ name: '', color: 'var(--color-accent)', budget_limit: '' }); setCatMsg('Category created!'); setTimeout(() => setCatMsg(''), 2000) },
  })
  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch('/api/v1/ledger/categories/' + id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ledger', 'categories'] }); setEditCat(null); setCatMsg('Updated!'); setTimeout(() => setCatMsg(''), 2000) },
  })

  const balance = useCountUp(summary ? Number(summary.total_balance) : 0)
  const income = useCountUp(summary ? Number(summary.total_income) : 0)
  const expenses = useCountUp(summary ? Number(summary.total_expenses) : 0)
  const transactions = (txData?.items || []).map((tx: any) => ({ ...tx, categoryName: cats.find((c: any) => c.id === tx.category_id)?.name || 'Other' }))
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthData = summary?.monthly?.find((m: any) => m.month === currentMonth)
  const burnOk = monthData ? monthData.expenses <= monthData.income : true
  const anomaly = cats.find((c: any) => { if (!c.budget_limit) return false; const spent = transactions.filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0); return spent > Number(c.budget_limit) * 1.2 })
  const monthStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  const chartData = (summary?.monthly || []).map((m: any) => ({ month: m.month.slice(5), income: Number(m.income), expenses: Number(m.expenses) }))

  // Pie chart: expense breakdown by category
  const pieData = cats
    .map((c: any) => {
      const spent = transactions.filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
      return { name: c.name, value: spent }
    })
    .filter((d: any) => d.value > 0)
    .sort((a: any, b: any) => b.value - a.value)

  function openQuickLog(cat: string) { setQuickCat(cat); setForm(f => ({ ...f, type: 'expense', description: cat })); setShowAdd(true); setActiveTab('overview') }

  return (
    <PageLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2.2rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1 }}>LEDGER</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>{monthStr}</p>
        </div>
        <button onClick={() => { setShowAdd(s => !s); setActiveTab('overview') }} style={{ padding: '8px 14px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.85rem', letterSpacing: '0.06em', color: '#0A0A0F' }}>+ LOG</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
        {(['overview', 'transactions', 'budget'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 14px', background: 'none', border: 'none', borderBottom: activeTab === t ? '2px solid ' + Y : '2px solid transparent', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.7rem', letterSpacing: '0.08em', color: activeTab === t ? Y : 'var(--color-text-muted)', marginBottom: '-1px', transition: 'color 150ms, border-color 150ms', textTransform: 'uppercase' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Add form — always visible when open */}
      {showAdd && (
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>{quickCat ? 'QUICK LOG - ' + quickCat.toUpperCase() : 'NEW TRANSACTION'}</div>
          {addSuccess && <div style={{ marginBottom: '10px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(0,229,160,0.1)', border: '1px solid ' + MINT, color: MINT, fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>Transaction added</div>}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {['expense', 'income'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid ' + (form.type === t ? (t === 'income' ? MINT : RED) : 'var(--color-border)'), background: form.type === t ? (t === 'income' ? MINT + '12' : RED + '12') : 'transparent', color: form.type === t ? (t === 'income' ? MINT : RED) : 'var(--color-text-muted)', fontFamily: 'var(--font-head)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[{ key: 'amount', placeholder: 'Amount (BDT)', type: 'number' }, { key: 'description', placeholder: 'Description', type: 'text' }, { key: 'date', placeholder: 'Date', type: 'date' }].map(({ key, placeholder, type }) => (
              <input key={key} type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="input-field" />
            ))}
            {cats.length > 0 && <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="input-field" style={{ cursor: 'pointer' }}><option value="">Category (optional)</option>{cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { if (form.amount && form.description) createTxMutation.mutate(form) }} disabled={!form.amount || !form.description || createTxMutation.isPending} style={{ flex: 1, padding: '10px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.8rem', color: '#0A0A0F', opacity: (!form.amount || !form.description || createTxMutation.isPending) ? 0.5 : 1 }}>{createTxMutation.isPending ? 'ADDING...' : 'ADD ' + form.type.toUpperCase()}</button>
              <button onClick={() => { setShowAdd(false); setQuickCat(null) }} style={{ padding: '10px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>X</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (<>
        {/* Balance hero */}
        <div style={{ background: 'linear-gradient(180deg, var(--color-surface-2) 0%, var(--glass-bg) 100%)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>TOTAL BALANCE</span>
            <button onClick={() => setBalanceVisible(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-head)', fontSize: '0.65rem', letterSpacing: '0.06em' }}>{balanceVisible ? 'HIDE' : 'SHOW'}</button>
          </div>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.4rem', color: Y, marginBottom: '14px' }}>{balanceVisible ? 'BDT ' + balance.toLocaleString() : 'BDT ......'}</div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div><div style={{ fontFamily: 'var(--font-head)', fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: '3px' }}>INCOME</div><div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', color: MINT }}>BDT {income.toLocaleString()}</div></div>
            <div><div style={{ fontFamily: 'var(--font-head)', fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: '3px' }}>SPENT</div><div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', color: RED }}>BDT {expenses.toLocaleString()}</div></div>
          </div>
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: burnOk ? MINT : RED, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Month burn rate: <span style={{ color: burnOk ? MINT : RED }}>{burnOk ? 'on track' : 'over budget'}</span></span>
          </div>
        </div>

        {/* Monthly bar chart */}
        {chartData.length > 0 && (
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '14px' }}>MONTHLY INCOME vs EXPENSES</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => (v/1000).toFixed(0) + 'k'} />
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--color-text-primary)' }} formatter={(v: number) => ['BDT ' + v.toLocaleString(), '']} />
                <Bar dataKey="income" name="Income" fill={MINT} radius={[2,2,0,0]} fillOpacity={0.85} />
                <Bar dataKey="expenses" name="Expenses" fill={RED} radius={[2,2,0,0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: MINT }} /><span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Income</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '8px', height: '8px', borderRadius: '1px', background: RED }} /><span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Expenses</span></div>
            </div>
          </div>
        )}

        {/* Expense breakdown pie chart */}
        {pieData.length > 0 && (
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '14px' }}>WHERE YOU SPEND MOST</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--color-text-primary)' }} formatter={(v: number) => ['BDT ' + v.toLocaleString(), '']} />
                <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Anomaly */}
        {anomaly && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderLeft: '3px solid ' + RED, borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}><span style={{ color: '#F59E0B' }}>!</span><span style={{ fontFamily: 'var(--font-head)', fontSize: '0.72rem', color: '#F59E0B', letterSpacing: '0.06em' }}>ANOMALY DETECTED</span></div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Unusual spending in {anomaly.name} this week.</div>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>REVIEW</span>
          </div>
        )}

        {/* Spending overview */}
        {cats.filter((c: any) => c.budget_limit).length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.8rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '12px' }}>SPENDING OVERVIEW</div>
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              {cats.filter((c: any) => c.budget_limit).map((c: any) => {
                const spent = transactions.filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
                return <CategoryBar key={c.id} name={c.name} spent={spent} budget={Number(c.budget_limit)} color={CAT_COLORS[c.name] || Y} />
              })}
            </div>
          </div>
        )}

        {/* Quick log */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>QUICK LOG</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['FOOD', 'TRANSPORT', 'EDUCATION', 'OTHER'].map(cat => (
              <button key={cat} onClick={() => openQuickLog(cat)} style={{ flex: '0 0 auto', padding: '8px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{cat}</button>
            ))}
          </div>
        </div>
      </>)}

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '0.8rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>ALL TRANSACTIONS</span>
            <a href={import.meta.env.VITE_API_URL + '/api/v1/ledger/export'} download style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: Y, textDecoration: 'none' }}><DownloadIcon size={12} /> Export</a>
          </div>
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {transactions.length === 0 ? <EmptyTrainer /> : transactions.map((tx: any, i: number) => {
              const isIncome = tx.type === 'income'
              const catColor = CAT_COLORS[tx.categoryName] || MUTED
              const initial = (tx.categoryName || '?')[0].toUpperCase()
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderBottom: i < transactions.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', flexShrink: 0, background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: '0.85rem', color: catColor }}>{initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || tx.categoryName}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{tx.categoryName} - {tx.date}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: isIncome ? MINT : RED, flexShrink: 0 }}>{isIncome ? '+' : '-'}BDT {Number(tx.amount).toLocaleString()}</div>
                  <button onClick={() => deleteTxMutation.mutate(tx.id)} className="btn-danger-hover"><TrashIcon size={12} /></button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* BUDGET TAB */}
      {activeTab === 'budget' && (
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.8rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '14px' }}>MANAGE CATEGORIES</div>
          {catMsg && <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(0,229,160,0.1)', border: '1px solid ' + MINT, color: MINT, fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{catMsg}</div>}

          {/* Add category form */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.7rem', color: Y, letterSpacing: '0.08em', marginBottom: '10px' }}>+ NEW CATEGORY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input placeholder="Category name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <label style={{ fontFamily: 'var(--font-head)', fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>COLOR</label>
                  <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} style={{ width: '36px', height: '32px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none', padding: '2px' }} />
                </div>
                <input placeholder="Budget limit (BDT, optional)" type="number" value={catForm.budget_limit} onChange={e => setCatForm(f => ({ ...f, budget_limit: e.target.value }))} className="input-field" style={{ flex: 2 }} />
              </div>
              <button onClick={() => { if (catForm.name) createCatMutation.mutate() }} disabled={!catForm.name || createCatMutation.isPending} style={{ padding: '9px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.75rem', color: '#0A0A0F', opacity: !catForm.name ? 0.5 : 1 }}>
                {createCatMutation.isPending ? 'CREATING...' : 'CREATE CATEGORY'}
              </button>
            </div>
          </div>

          {/* Existing categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cats.map((c: any) => {
              const spent = transactions.filter((t: any) => t.category_id === c.id && t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0)
              const isEditing = editCat?.id === c.id
              return (
                <div key={c.id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderLeft: '3px solid ' + (c.color || Y), borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input value={editCat.name} onChange={e => setEditCat((p: any) => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Name" />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="color" value={editCat.color || 'var(--color-accent)'} onChange={e => setEditCat((p: any) => ({ ...p, color: e.target.value }))} style={{ width: '36px', height: '32px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none', padding: '2px' }} />
                        <input type="number" value={editCat.budget_limit || ''} onChange={e => setEditCat((p: any) => ({ ...p, budget_limit: e.target.value }))} className="input-field" placeholder="Budget limit (BDT)" style={{ flex: 1 }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => updateCatMutation.mutate({ id: c.id, data: { name: editCat.name, color: editCat.color, budget_limit: editCat.budget_limit ? Number(editCat.budget_limit) : null } })} style={{ flex: 1, padding: '8px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.7rem', color: '#0A0A0F' }}>SAVE</button>
                        <button onClick={() => setEditCat(null)} style={{ padding: '8px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>X</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c.color || Y, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.85rem', letterSpacing: '0.02em', color: 'var(--color-text-primary)' }}>{c.name}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          Spent: BDT {spent.toLocaleString()}{c.budget_limit ? ' / Budget: BDT ' + Number(c.budget_limit).toLocaleString() : ' (no budget)'}
                        </div>
                      </div>
                      <button onClick={() => setEditCat({ id: c.id, name: c.name, color: c.color || 'var(--color-accent)', budget_limit: c.budget_limit || '' })} style={{ padding: '5px 10px', background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.6rem', letterSpacing: '0.06em', color: Y }}>EDIT</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
