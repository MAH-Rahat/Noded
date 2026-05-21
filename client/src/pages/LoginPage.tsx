import React from 'react'
import { AuthCard } from '../components/auth/AuthCard'
import { LoginForm } from '../components/auth/LoginForm'
import { PageTransition } from '../components/layout/PageTransition'

export default function LoginPage() {
  return (
    <PageTransition>
      <AuthCard title="Welcome back" subtitle="Sign in to your personal hub">
        <LoginForm />
      </AuthCard>
    </PageTransition>
  )
}
