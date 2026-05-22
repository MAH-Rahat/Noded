import React, { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'
import { AuthGuard } from './components/layout/AuthGuard'
import { useUIStore } from './stores/uiStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetRequestPage from './pages/ResetRequestPage'
import ResetFormPage from './pages/ResetFormPage'
import DashboardPage from './pages/DashboardPage'
import LedgerPage from './pages/LedgerPage'
import TasksPage from './pages/TasksPage'
import CanvasPage from './pages/CanvasPage'
import VaultPage from './pages/VaultPage'
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

function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OnlineWatcher />
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetRequestPage />} />
          <Route path="/reset-password/:token" element={<ResetFormPage />} />

          {/* App routes — each module is its own page */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/ledger"    element={<Protected><LedgerPage /></Protected>} />
          <Route path="/tasks"     element={<Protected><TasksPage /></Protected>} />
          <Route path="/canvas"    element={<Protected><CanvasPage /></Protected>} />
          <Route path="/vault"     element={<Protected><VaultPage /></Protected>} />
          <Route path="/settings"  element={<Protected><SettingsPage /></Protected>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
