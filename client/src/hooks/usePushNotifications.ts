import { useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'

export function usePushNotifications() {
  const token = useAuthStore((s) => s.token)
  const { notificationPermission, setNotificationPermission } = useUIStore()

  useEffect(() => {
    if (!token || !('Notification' in window) || !('serviceWorker' in navigator)) return

    // Only request if not yet asked
    if (notificationPermission === 'not_asked') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission as 'granted' | 'denied')
        if (permission === 'granted') {
          subscribeUser()
        }
      })
    } else if (notificationPermission === 'granted') {
      subscribeUser()
    }
  }, [token])

  async function subscribeUser() {
    try {
      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const { endpoint, keys } = subscription.toJSON() as any
      await api.post('/api/v1/notifications/subscribe', {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
    } catch {
      // Push subscription failed silently — not critical
    }
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
