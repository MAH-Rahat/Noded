import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'

export function RegisterForm() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  function validate() {
    const e: Record<string, string> = {}
    if (!username.trim()) e.username = 'Username is required'
    if (!email.trim()) e.email = 'Email is required'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await api.post('/api/v1/auth/register', { username, email, password })
      const token = res.data?.data?.access_token
      if (token) {
        setToken(token, false)
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      setServerError(err?.response?.data?.detail ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="yourname"
        error={errors.username}
        autoComplete="username"
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        error={errors.password}
        autoComplete="new-password"
      />
      <Input
        label="Confirm Password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Repeat password"
        error={errors.confirm}
        autoComplete="new-password"
      />

      {serverError && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)', margin: 0 }}>{serverError}</p>
      )}

      <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '8px' }}>
        Create account
      </Button>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
