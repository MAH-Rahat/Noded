import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
