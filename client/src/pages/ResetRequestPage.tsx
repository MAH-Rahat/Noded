import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { PageTransition } from '../components/layout/PageTransition'
import api from '../lib/api'

export default function ResetRequestPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/v1/auth/forgot-password', { email })
    } finally {
      // Always show success to prevent email enumeration
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <AuthCard title="Reset password" subtitle="Enter your email and we'll send a reset link">
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-success)', marginBottom: '16px', fontSize: '0.9rem' }}>
              If that email is registered, a reset link is on its way.
            </p>
            <Link to="/login" style={{ color: 'var(--color-accent)', fontSize: '0.875rem' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>
              Send reset link
            </Button>
            <Link
              to="/login"
              style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}
            >
              Back to sign in
            </Link>
          </form>
        )}
      </AuthCard>
    </PageTransition>
  )
}
