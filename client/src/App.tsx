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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OnlineWatcher />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetRequestPage />} />
          <Route path="/reset-password/:token" element={<ResetFormPage />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <SettingsPage />
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
