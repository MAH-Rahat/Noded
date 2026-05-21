import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserProfile {
  id: string
  username: string
  email: string
  accent_color: string
  background_color: string
  onboarding_completed: boolean
}

interface AuthState {
  token: string | null
  user: UserProfile | null
  rememberMe: boolean
  setToken: (token: string, rememberMe?: boolean) => void
  setUser: (user: UserProfile) => void
  setAccentColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      rememberMe: false,

      setToken: (token, rememberMe = false) => {
        set({ token, rememberMe })
        if (rememberMe) {
          localStorage.setItem('token', token)
        } else {
          sessionStorage.setItem('token', token)
          localStorage.removeItem('token')
        }
        // Apply theme from stored user if available
      },

      setUser: (user) => {
        set({ user })
        // Apply CSS custom properties from user preferences
        document.documentElement.style.setProperty('--color-accent', accentColorMap[user.accent_color] ?? user.accent_color)
        document.documentElement.style.setProperty('--color-bg', user.background_color)
      },

      setAccentColor: (color) => {
        set((state) => ({
          user: state.user ? { ...state.user, accent_color: color } : state.user,
        }))
        document.documentElement.style.setProperty('--color-accent', color)
      },

      setBackgroundColor: (color) => {
        set((state) => ({
          user: state.user ? { ...state.user, background_color: color } : state.user,
        }))
        document.documentElement.style.setProperty('--color-bg', color)
      },

      logout: () => {
        set({ token: null, user: null, rememberMe: false })
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
      },
    }),
    {
      name: 'noded-auth',
      partialize: (state) => ({ token: state.token, rememberMe: state.rememberMe }),
    },
  ),
)

// Map accent color names to hex values
const accentColorMap: Record<string, string> = {
  electric_blue: '#3B82F6',
  neon_green: '#22C55E',
  violet_purple: '#8B5CF6',
}
