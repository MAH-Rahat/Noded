import { create } from 'zustand'

type NotificationPermission = 'granted' | 'denied' | 'not_asked'

interface UIState {
  searchOpen: boolean
  onboardingStep: number | null // null = not showing
  notificationPermission: NotificationPermission
  isOffline: boolean
  openSearch: () => void
  closeSearch: () => void
  setOnboardingStep: (step: number | null) => void
  setNotificationPermission: (permission: NotificationPermission) => void
  setOffline: (offline: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  searchOpen: false,
  onboardingStep: null,
  notificationPermission: 'not_asked',
  isOffline: !navigator.onLine,

  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  setNotificationPermission: (permission) => set({ notificationPermission: permission }),
  setOffline: (offline) => set({ isOffline: offline }),
}))
