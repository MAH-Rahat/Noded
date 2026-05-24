import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import queryClient from './lib/queryClient'
import { AuthGuard } from './components/layout/AuthGuard'
import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'
import { SearchOverlay } from './components/overlays/SearchOverlay'
import { OnboardingOverlay } from './components/overlays/OnboardingOverlay'
import { usePokemonTheme } from './hooks/usePokemonTheme'
import { IS_PREVIEW, MOCK_SUMMARY, MOCK_TASKS, MOCK_HISTORY } from './lib/mockData'
import api from './lib/api'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetRequestPage from './pages/ResetRequestPage'
import ResetFormPage from './pages/ResetFormPage'
import DashboardPage from './pages/DashboardPage'
import LedgerPage from './pages/LedgerPage'
import TasksPage from './pages/TasksPage'
import CanvasPage from './pages/CanvasPage'
import SettingsPage from './pages/SettingsPage'

function OnlineWatcher() {
  const setOffline = useUIStore((s) => s.setOffline)
  useEffect(() => {
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [setOffline])
  return null
}

// Runs the pokemon theme hook globally so accent color applies on every page
function GlobalPokemonTheme() {
  const token = useAuthStore((s) => s.token)
  const today = new Date().toISOString().split('T')[0]

  const { data: summary } = useQuery({
    queryKey: ['ledger', 'summary'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_SUMMARY) : api.get('/api/v1/ledger/summary').then(r => r.data.data),
    enabled: !!token || IS_PREVIEW,
    staleTime: 1000 * 60 * 5,
  })
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks', today],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_TASKS) : api.get(`/api/v1/tasks?date=${today}`).then(r => r.data.data),
    enabled: !!token || IS_PREVIEW,
    staleTime: 1000 * 60 * 5,
  })
  const { data: history = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['tasks', 'history'],
    queryFn: () => IS_PREVIEW ? Promise.resolve(MOCK_HISTORY) : api.get('/api/v1/tasks/history').then(r => r.data.data),
    enabled: !!token || IS_PREVIEW,
    staleTime: 1000 * 60 * 5,
  })

  const completedToday = tasks.filter((t: any) => t.state === 'completed').length
  const totalToday = tasks.length
  const taskPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const savingsRate = summary && summary.total_income > 0
    ? Math.round(((summary.total_income - summary.total_expenses) / summary.total_income) * 100)
    : 20
  const streak = useMemo(() => {
    let count = 0; const d = new Date()
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split('T')[0]
      if ((history as any)[key]) { count++; d.setDate(d.getDate() - 1) } else break
    }
    return count
  }, [history])

  usePokemonTheme({ taskPct, savingsRate, streak })
  return null
}

function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

function AppShell() {
  const user = useAuthStore((s) => s.user)
  const theme = useUIStore((s) => s.theme)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (user && user.onboarding_completed === false) {
      setShowOnboarding(true)
    }
  }, [user])

  return (
    <>
      <OnlineWatcher />
      <GlobalPokemonTheme />
      <SearchOverlay />
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetRequestPage />} />
        <Route path="/reset-password/:token" element={<ResetFormPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/ledger"    element={<Protected><LedgerPage /></Protected>} />
        <Route path="/tasks"     element={<Protected><TasksPage /></Protected>} />
        <Route path="/canvas"    element={<Protected><CanvasPage /></Protected>} />
        <Route path="/settings"  element={<Protected><SettingsPage /></Protected>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
