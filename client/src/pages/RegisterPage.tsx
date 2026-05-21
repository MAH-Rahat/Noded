import React from 'react'
import { AuthCard } from '../components/auth/AuthCard'
import { RegisterForm } from '../components/auth/RegisterForm'
import { PageTransition } from '../components/layout/PageTransition'

export default function RegisterPage() {
  return (
    <PageTransition>
      <AuthCard title="Create your hub" subtitle="Set up your personal command center">
        <RegisterForm />
      </AuthCard>
    </PageTransition>
  )
}
