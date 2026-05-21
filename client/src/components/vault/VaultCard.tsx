import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModuleCard } from '../layout/ModuleCard'
import { VaultUnlockModal } from './VaultUnlockModal'
import { SnippetCard } from './SnippetCard'
import { EmptyState } from '../ui/EmptyState'
import { SkeletonBlock } from '../ui/Skeleton'
import { useVaultStore } from '../../stores/vaultStore'
import api from '../../lib/api'

interface Snippet {
  id: string
  label: string
  content: string
  snippet_type: 'api_key' | 'password' | 'personal_id'
  category_label?: string | null
}

export function VaultCard() {
  const qc = useQueryClient()
  const { sessionToken, unlock, lock, isUnlocked } = useVaultStore()
  const [unlockError, setUnlockError] = useState('')
  const [unlockLoading, setUnlockLoading] = useState(false)

  const vaultOpen = isUnlocked()

  const { data: snippets = [], isLoading } = useQuery<Snippet[]>({
    queryKey: ['vault', 'snippets'],
    queryFn: () =>
      api.get('/api/v1/vault/snippets', {
        headers: { 'x-vault-token': sessionToken ?? '' },
      }).then((r) => r.data.data),
    enabled: vaultOpen,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/vault/snippets/${id}`, {
        headers: { 'x-vault-token': sessionToken ?? '' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault'] }),
  })

  async function handleUnlock(pin: string) {
    setUnlockError('')
    setUnlockLoading(true)
    try {
      const res = await api.post('/api/v1/vault/authenticate', { pin })
      const { session_token, expires_at } = res.data.data
      unlock(session_token, new Date(expires_at))
      qc.invalidateQueries({ queryKey: ['vault'] })
    } catch (err: any) {
      setUnlockError(err?.response?.data?.detail ?? 'Incorrect PIN')
    } finally {
      setUnlockLoading(false)
    }
  }

  const lockAction = vaultOpen ? (
    <button
      onClick={lock}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--color-text-muted)', fontSize: '0.75rem',
      }}
    >
      🔒 Lock
    </button>
  ) : null

  return (
    <ModuleCard title="The Vault" headerAction={lockAction}>
      {!vaultOpen ? (
        <VaultUnlockModal
          onUnlock={handleUnlock}
          error={unlockError}
          loading={unlockLoading}
        />
      ) : isLoading ? (
        <SkeletonBlock lines={3} />
      ) : snippets.length === 0 ? (
        <EmptyState message="No secrets stored yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {snippets.map((s) => (
            <SnippetCard
              key={s.id}
              {...s}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </ModuleCard>
  )
}
