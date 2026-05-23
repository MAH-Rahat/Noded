import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../components/layout/PageLayout'
import { useVaultStore } from '../stores/vaultStore'
import { KeyIcon, LockIcon, IdCardIcon, EyeIcon, EyeOffIcon, CopyIcon, TrashIcon, PlusIcon, ShieldIcon } from '../components/ui/Icons'
import api from '../lib/api'

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  api_key: KeyIcon,
  password: LockIcon,
  personal_id: IdCardIcon,
}
const TYPE_LABELS: Record<string, string> = {
  api_key: 'API Key',
  password: 'Password',
  personal_id: 'Personal ID',
}
const TYPE_COLORS: Record<string, string> = {
  api_key: '#3B82F6',
  password: '#8B5CF6',
  personal_id: '#10B981',
}

export default function VaultPage() {
  const qc = useQueryClient()
  const { sessionToken, unlock, lock, isUnlocked } = useVaultStore()
  const [pin, setPin] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ label: '', content: '', snippet_type: 'password', category_label: '' })

  const vaultOpen = isUnlocked()

  const { data: snippets = [] } = useQuery<any[]>({
    queryKey: ['vault', 'snippets'],
    queryFn: () => api.get('/api/v1/vault/snippets', { headers: { 'x-vault-token': sessionToken ?? '' } }).then(r => r.data.data),
    enabled: vaultOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/vault/snippets/${id}`, { headers: { 'x-vault-token': sessionToken ?? '' } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] }),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/v1/vault/snippets', addForm, { headers: { 'x-vault-token': sessionToken ?? '' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vault'] }); setShowAdd(false); setAddForm({ label: '', content: '', snippet_type: 'password', category_label: '' }) },
  })

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setUnlockError('')
    setUnlockLoading(true)
    try {
      const res = await api.post('/api/v1/vault/authenticate', { pin })
      const { session_token, expires_at } = res.data.data
      unlock(session_token, new Date(expires_at))
      setPin('')
    } catch (err: any) {
      setUnlockError(err?.response?.data?.detail ?? 'Incorrect PIN')
    } finally {
      setUnlockLoading(false)
    }
  }

  function toggleReveal(id: string) {
    setRevealedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleCopy(id: string, content: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <PageLayout title="Vault">
      {!vaultOpen ? (
        /* Lock screen */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6', boxShadow: '0 0 40px rgba(139,92,246,0.2)' }}>
              <ShieldIcon size={36} strokeWidth={1.5} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>Vault Locked</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Enter your PIN to access encrypted secrets</p>
          </div>
          <form onSubmit={handleUnlock} style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Enter PIN" inputMode="numeric" autoFocus
              style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${unlockError ? '#F43F5E' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)', fontSize: '1rem', outline: 'none', textAlign: 'center', letterSpacing: '0.3em', boxSizing: 'border-box' as any }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = unlockError ? '#F43F5E' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            {unlockError && <p style={{ fontSize: '0.8rem', color: '#F43F5E', textAlign: 'center', margin: 0 }}>{unlockError}</p>}
            <button type="submit" disabled={unlockLoading} style={{ padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none', color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(139,92,246,0.35)', opacity: unlockLoading ? 0.6 : 1 }}>
              {unlockLoading ? 'Unlocking…' : 'Unlock Vault'}
            </button>
          </form>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '240px' }}>
            All secrets are encrypted with AES-256. Your PIN never leaves your device.
          </p>
        </div>
      ) : (
        /* Unlocked */
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>Vault Unlocked</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>· {snippets.length} secrets</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAdd(s => !s)} className="glow-hover" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600 }}>
                <PlusIcon size={14} /> Add
              </button>
              <button onClick={lock} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600 }}>
                <LockIcon size={14} /> Lock
              </button>
            </div>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>New Secret</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['password', 'api_key', 'personal_id'].map(t => (
                    <button key={t} onClick={() => setAddForm(f => ({ ...f, snippet_type: t }))} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: '1px solid', borderColor: addForm.snippet_type === t ? TYPE_COLORS[t] : 'rgba(255,255,255,0.08)', background: addForm.snippet_type === t ? `${TYPE_COLORS[t]}15` : 'transparent', color: addForm.snippet_type === t ? TYPE_COLORS[t] : 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.7rem', fontWeight: 600 }}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                {[{ key: 'label', placeholder: 'Label (e.g. GitHub Token)' }, { key: 'content', placeholder: 'Secret value' }, { key: 'category_label', placeholder: 'Category (optional)' }].map(({ key, placeholder }) => (
                  <input key={key} placeholder={placeholder} value={(addForm as any)[key]} onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    type={key === 'content' ? 'password' : 'text'}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--color-text-primary)', fontFamily: key === 'content' ? 'var(--font-mono)' : 'var(--font-ui)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as any }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                ))}
                <button onClick={() => createMutation.mutate()} style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', border: 'none', color: '#fff', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Save Secret
                </button>
              </div>
            </div>
          )}

          {/* Snippets */}
          {snippets.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No secrets stored yet. Add your first one.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {snippets.map((s: any) => {
                const Icon = TYPE_ICONS[s.snippet_type] || LockIcon
                const color = TYPE_COLORS[s.snippet_type] || '#8B5CF6'
                const isRevealed = revealedIds.has(s.id)
                const isCopied = copiedId === s.id
                return (
                  <div key={s.id} className="glass-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: color, borderRadius: '20px 0 0 20px' }} />
                    <div style={{ paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                          <Icon size={15} strokeWidth={1.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{s.label}</div>
                          <div style={{ fontSize: '0.7rem', color, fontWeight: 600 }}>{TYPE_LABELS[s.snippet_type]}{s.category_label ? ` · ${s.category_label}` : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => toggleReveal(s.id)} style={{ padding: '6px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            {isRevealed ? <EyeOffIcon size={13} /> : <EyeIcon size={13} />}
                          </button>
                          <button onClick={() => handleCopy(s.id, s.content)} style={{ padding: '6px', borderRadius: '7px', background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, color: isCopied ? '#10B981' : 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 200ms' }}>
                            <CopyIcon size={13} />
                          </button>
                  <button onClick={() => deleteMutation.mutate(s.id)} className="btn-danger-hover" style={{ padding: '6px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <TrashIcon size={13} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.06)', color: isRevealed ? 'var(--color-text-primary)' : 'transparent', textShadow: isRevealed ? 'none' : '0 0 10px rgba(255,255,255,0.5)', filter: isRevealed ? 'none' : 'blur(5px)', userSelect: isRevealed ? 'text' : 'none', transition: 'filter 200ms', wordBreak: 'break-all' }}>
                        {s.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
