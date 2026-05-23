import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type NotificationPermission = 'granted' | 'denied' | 'not_asked'
export type Theme = 'dark' | 'light'

interface UIState {
  searchOpen: boolean
  onboardingStep: number | null
  notificationPermission: NotificationPermission
  isOffline: boolean
  theme: Theme
  openSearch: () => void
  closeSearch: () => void
  setOnboardingStep: (step: number | null) => void
  setNotificationPermission: (permission: NotificationPermission) => void
  setOffline: (offline: boolean) => void
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      searchOpen: false,
      onboardingStep: null,
      notificationPermission: 'not_asked',
      isOffline: !navigator.onLine,
      theme: 'dark',

      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setNotificationPermission: (permission) => set({ notificationPermission: permission }),
      setOffline: (offline) => set({ isOffline: offline }),
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ theme: next })
      },
      setTheme: (t) => {
        document.documentElement.setAttribute('data-theme', t)
        set({ theme: t })
      },
    }),
    {
      name: 'noded-ui',
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      },
    }
  )
)
