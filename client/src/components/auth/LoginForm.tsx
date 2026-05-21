import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'

export function LoginForm() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/v1/auth/login', { email, password, remember_me: rememberMe })
      const token = res.data?.data?.access_token
      if (token) {
        setToken(token, rememberMe)
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        autoComplete="email"
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />

      {/* Remember me */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px' }}
        />
        Remember me
      </label>

      {error && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)', margin: 0 }}>{error}</p>
      )}

      <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '8px' }}>
        Sign in
      </Button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
          marginTop: '4px',
        }}
      >
        <Link
          to="/reset-password"
          style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
        >
          Forgot password?
        </Link>
        <Link
          to="/register"
          style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
        >
          Create account
        </Link>
      </div>

      {/* Guest preview button */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-block',
            width: '100%',
            padding: '10px',
            borderRadius: 'var(--radius-input)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            textAlign: 'center',
            transition: 'border-color 150ms, color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)'
            e.currentTarget.style.color = 'var(--color-accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color = 'var(--color-text-muted)'
          }}
        >
          👁 Preview as Guest
        </Link>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
          Demo mode — no backend required
        </p>
      </div>
    </form>
  )
}
