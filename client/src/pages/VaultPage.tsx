import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useVaultStore } from '../stores/vaultStore'
import { KeyIcon, LockIcon, IdCardIcon, EyeIcon, EyeOffIcon, CopyIcon, TrashIcon, PlusIcon, ShieldIcon } from '../components/ui/Icons'
import api from '../lib/api'

const Y = '#FFD700'
const TYPE_ICONS: Record<string, React.ComponentType<any>> = { api_key: KeyIcon, password: LockIcon, personal_id: IdCardIcon }
const TYPE_LABELS: Record<string, string> = { api_key: 'API KEY', password: 'PASSWORD', personal_id: 'PERSONAL ID' }
const TYPE_COLORS: Record<string, string> = { api_key: '#3D6BFF', password: '#8B5CF6', personal_id: '#00E5A0' }

// ── Setup screen (first time PIN creation) ────────────────────────────────────
function VaultSetup({ onSetup }: { onSetup: () => void }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (pin.length < 4) { setErr('PIN must be at least 4 digits'); return }
    if (pin !== confirm) { setErr('PINs do not match'); return }
    setLoading(true)
    try {
      await api.post('/api/v1/vault/setup', { pin })
      onSetup()
    } catch (ex: any) {
      setErr(ex?.response?.data?.detail ?? 'Setup failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: '20px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', background: `${Y}15`, border: `1px solid ${Y}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Y }}>
        <ShieldIcon size={32} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', marginBottom: '6px' }}>SETUP VAULT</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)', maxWidth: '260px' }}>Create a PIN to protect your encrypted secrets. This PIN never leaves your device.</p>
      </div>
      <form onSubmit={handleSetup} style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type='password' value={pin} onChange={e => setPin(e.target.value)} placeholder='Create PIN (min 4 digits)' inputMode='numeric' autoFocus
          className='input-field' style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1rem' }} />
        <input type='password' value={confirm} onChange={e => setConfirm(e.target.value)} placeholder='Confirm PIN'
          className='input-field' style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1rem' }} />
        {err && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#FF4444', textAlign: 'center', margin: 0 }}>{err}</p>}
        <button type='submit' disabled={loading} style={{ padding: '12px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.9rem', letterSpacing: '0.06em', color: '#0A0A0F', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'SETTING UP...' : 'CREATE VAULT'}
        </button>
      </form>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '240px' }}>AES-256 encryption. Your secrets are safe.</p>
    </div>
  )
}

// ── Lock screen ───────────────────────────────────────────────────────────────
function VaultLock({ onUnlock }: { onUnlock: (token: string, exp: Date) => void }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const res = await api.post('/api/v1/vault/authenticate', { pin })
      const { session_token, expires_at } = res.data.data
      onUnlock(session_token, new Date(expires_at))
      setPin('')
    } catch (ex: any) { setErr(ex?.response?.data?.detail ?? 'Incorrect PIN') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: '20px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
        <ShieldIcon size={32} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', marginBottom: '6px' }}>VAULT LOCKED</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Enter your PIN to access encrypted secrets</p>
      </div>
      <form onSubmit={handleUnlock} style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type='password' value={pin} onChange={e => setPin(e.target.value)} placeholder='Enter PIN' inputMode='numeric' autoFocus
          className='input-field' style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1rem', borderColor: err ? '#FF4444' : undefined }} />
        {err && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#FF4444', textAlign: 'center', margin: 0 }}>{err}</p>}
        <button type='submit' disabled={loading} style={{ padding: '12px', background: '#8B5CF6', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.9rem', letterSpacing: '0.06em', color: '#fff', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'UNLOCKING...' : 'UNLOCK VAULT'}
        </button>
      </form>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VaultPage() {
  const qc = useQueryClient()
  const { sessionToken, unlock, lock, isUnlocked } = useVaultStore()
  const [vaultSetup, setVaultSetup] = useState<boolean | null>(null) // null = loading
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ label: '', content: '', snippet_type: 'password', category_label: '' })

  // Check if vault is set up
  React.useEffect(() => {
    api.get('/api/v1/vault/status').then(r => setVaultSetup(r.data.data?.setup ?? false)).catch(() => setVaultSetup(false))
  }, [])

  const vaultOpen = isUnlocked()

  const { data: snippets = [] } = useQuery<any[]>({
    queryKey: ['vault', 'snippets'],
    queryFn: () => api.get('/api/v1/vault/snippets', { headers: { 'x-vault-token': sessionToken ?? '' } }).then(r => r.data.data),
    enabled: vaultOpen,
  })

  const deleteMutation = useMutation({ mutationFn: (id: string) => api.delete('/api/v1/vault/snippets/' + id, { headers: { 'x-vault-token': sessionToken ?? '' } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] }) })
  const createMutation = useMutation({ mutationFn: () => api.post('/api/v1/vault/snippets', addForm, { headers: { 'x-vault-token': sessionToken ?? '' } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['vault'] }); setShowAdd(false); setAddForm({ label: '', content: '', snippet_type: 'password', category_label: '' }) } })

  function toggleReveal(id: string) { setRevealedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }
  async function handleCopy(id: string, content: string) { await navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500) }

  if (vaultSetup === null) return <PageLayout><div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>Loading vault...</div></PageLayout>
  if (!vaultSetup) return <PageLayout><VaultSetup onSetup={() => setVaultSetup(true)} /></PageLayout>
  if (!vaultOpen) return <PageLayout><VaultLock onUnlock={(token, exp) => unlock(token, exp)} /></PageLayout>

  return (
    <PageLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2.2rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1 }}>VAULT</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5A0', boxShadow: '0 0 6px #00E5A0' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#00E5A0' }}>Unlocked</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>· {snippets.length} secrets</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowAdd(s => !s)} style={{ padding: '8px 14px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.8rem', letterSpacing: '0.06em', color: '#0A0A0F', display: 'flex', alignItems: 'center', gap: '4px' }}><PlusIcon size={13} /> ADD</button>
          <button onClick={lock} style={{ padding: '8px 12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.8rem', letterSpacing: '0.06em', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><LockIcon size={13} /> LOCK</button>
        </div>
      </div>

      {showAdd && (
        <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>NEW SECRET</div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            {['password', 'api_key', 'personal_id'].map(t => (
              <button key={t} onClick={() => setAddForm(f => ({ ...f, snippet_type: t }))} style={{ flex: 1, padding: '7px 4px', borderRadius: 'var(--radius-md)', border: '1px solid', borderColor: addForm.snippet_type === t ? TYPE_COLORS[t] : 'var(--color-border)', background: addForm.snippet_type === t ? TYPE_COLORS[t] + '15' : 'transparent', color: addForm.snippet_type === t ? TYPE_COLORS[t] : 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.6rem', letterSpacing: '0.06em' }}>{TYPE_LABELS[t]}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[{ key: 'label', placeholder: 'Label (e.g. GitHub Token)' }, { key: 'content', placeholder: 'Secret value' }, { key: 'category_label', placeholder: 'Category (optional)' }].map(({ key, placeholder }) => (
              <input key={key} placeholder={placeholder} value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))} type={key === 'content' ? 'password' : 'text'} className='input-field' style={{ fontFamily: key === 'content' ? 'var(--font-mono)' : 'var(--font-ui)' }} />
            ))}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => createMutation.mutate()} style={{ flex: 1, padding: '10px', background: Y, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontSize: '0.8rem', color: '#0A0A0F' }}>SAVE SECRET</button>
              <button onClick={() => setShowAdd(false)} style={{ padding: '10px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>X</button>
            </div>
          </div>
        </div>
      )}

      {snippets.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '48px 20px' }}>
          <svg width='48' height='48' viewBox='0 0 48 48' fill='none' style={{ opacity: 0.2 }}><circle cx='24' cy='24' r='22' stroke='var(--color-text-muted)' strokeWidth='2' /><path d='M2 24 H46' stroke='var(--color-text-muted)' strokeWidth='2' /><circle cx='24' cy='24' r='6' stroke='var(--color-text-muted)' strokeWidth='2' fill='var(--color-surface)' /></svg>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No secrets stored yet, Trainer.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {snippets.map((s: any) => {
            const Icon = TYPE_ICONS[s.snippet_type] || LockIcon
            const color = TYPE_COLORS[s.snippet_type] || '#8B5CF6'
            const isRevealed = revealedIds.has(s.id)
            const isCopied = copiedId === s.id
            return (
              <div key={s.id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderLeft: '3px solid ' + color, borderRadius: 'var(--radius-md)', padding: '14px 14px 14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-md)', background: color + '15', border: '1px solid ' + color + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}><Icon size={14} strokeWidth={1.8} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.85rem', letterSpacing: '0.02em', color: 'var(--color-text-primary)' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: '0.6rem', color, letterSpacing: '0.06em' }}>{TYPE_LABELS[s.snippet_type]}{s.category_label ? ' · ' + s.category_label : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => toggleReveal(s.id)} style={{ padding: '5px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{isRevealed ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}</button>
                    <button onClick={() => handleCopy(s.id, s.content)} style={{ padding: '5px', borderRadius: 'var(--radius-md)', background: isCopied ? '#00E5A015' : 'var(--color-surface-2)', border: '1px solid ' + (isCopied ? '#00E5A040' : 'var(--glass-border)'), color: isCopied ? '#00E5A0' : 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 200ms' }}><CopyIcon size={12} /></button>
                    <button onClick={() => deleteMutation.mutate(s.id)} className='btn-danger-hover' style={{ padding: '5px', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)', border: '1px solid var(--glass-border)' }}><TrashIcon size={12} /></button>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '8px 10px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', color: isRevealed ? 'var(--color-text-primary)' : 'transparent', textShadow: isRevealed ? 'none' : '0 0 10px rgba(255,255,255,0.5)', filter: isRevealed ? 'none' : 'blur(5px)', userSelect: isRevealed ? 'text' : 'none', transition: 'filter 200ms', wordBreak: 'break-all' }}>{s.content}</div>
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
