import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface VaultUnlockModalProps {
  onUnlock: (pin: string) => Promise<void>
  error?: string
  loading?: boolean
}

export function VaultUnlockModal({ onUnlock, error, loading }: VaultUnlockModalProps) {
  const [pin, setPin] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.trim()) await onUnlock(pin)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        height: '100%',
        minHeight: '200px',
      }}
    >
      <span style={{ fontSize: '2rem' }}>🔒</span>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Enter your vault PIN to unlock
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '240px' }}>
        <Input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          error={error}
          autoFocus
          inputMode="numeric"
        />
        <Button type="submit" loading={loading} style={{ width: '100%' }}>
          Unlock
        </Button>
      </form>
    </div>
  )
}
