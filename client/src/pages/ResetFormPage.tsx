import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthCard } from '../components/auth/AuthCard'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { PageTransition } from '../components/layout/PageTransition'
import api from '../lib/api'

export default function ResetFormPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPasswordError('')
    setConfirmError('')

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/v1/auth/reset-password', { token, new_password: password })
      navigate('/login', { state: { resetSuccess: true }, replace: true })
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 410) {
        setError('This reset link has expired or already been used.')
      } else {
        setError('Something went wrong. Please request a new reset link.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <AuthCard title="Set new password" subtitle="Choose a strong password for your account">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            error={passwordError}
            autoComplete="new-password"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            error={confirmError}
            autoComplete="new-password"
          />

          {error && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-danger)' }}>
              {error}{' '}
              <Link to="/reset-password" style={{ color: 'var(--color-accent)' }}>
                Request new link
              </Link>
            </div>
          )}

          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            Update password
          </Button>
        </form>
      </AuthCard>
    </PageTransition>
  )
}
