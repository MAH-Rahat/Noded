import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type NotificationPermission = 'granted' | 'denied' | 'not_asked'
export type Theme = 'dark' | 'light'
export type FontChoice = 'dm-sans' | 'outfit' | 'inter' | 'space-grotesk' | 'sora'

export const FONT_MAP: Record<FontChoice, string> = {
  'dm-sans':      "'DM Sans', system-ui, sans-serif",
  'outfit':       "'Outfit', system-ui, sans-serif",
  'inter':        "'Inter', system-ui, sans-serif",
  'space-grotesk':"'Space Grotesk', system-ui, sans-serif",
  'sora':         "'Sora', system-ui, sans-serif",
}

export interface DashboardWidgets {
  pokemon: boolean
  stats: boolean
  finance: boolean
  tasks: boolean
  transactions: boolean
  notes: boolean
  weekly: boolean
  quickAdd: boolean
}

interface UIState {
  searchOpen: boolean
  onboardingStep: number | null
  notificationPermission: NotificationPermission
  isOffline: boolean
  theme: Theme
  font: FontChoice
  dashWidgets: DashboardWidgets
  openSearch: () => void
  closeSearch: () => void
  setOnboardingStep: (step: number | null) => void
  setNotificationPermission: (permission: NotificationPermission) => void
  setOffline: (offline: boolean) => void
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  setFont: (f: FontChoice) => void
  toggleWidget: (key: keyof DashboardWidgets) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      searchOpen: false,
      onboardingStep: null,
      notificationPermission: 'not_asked',
      isOffline: !navigator.onLine,
      theme: 'dark',
      font: 'dm-sans',
      dashWidgets: {
        pokemon: true, stats: true, finance: true, tasks: true,
        transactions: true, notes: true, weekly: true, quickAdd: true,
      },

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
      setFont: (f) => {
        document.documentElement.style.setProperty('--font-ui', FONT_MAP[f])
        set({ font: f })
      },
      toggleWidget: (key) => set(s => ({ dashWidgets: { ...s.dashWidgets, [key]: !s.dashWidgets[key] } })),
    }),
    {
      name: 'noded-ui',
      partialize: (s) => ({ theme: s.theme, font: s.font, dashWidgets: s.dashWidgets }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) document.documentElement.setAttribute('data-theme', state.theme)
        if (state?.font) document.documentElement.style.setProperty('--font-ui', FONT_MAP[state.font])
      },
    }
  )
)
