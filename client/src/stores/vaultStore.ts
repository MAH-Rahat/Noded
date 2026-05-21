import { create } from 'zustand'

interface VaultState {
  sessionToken: string | null
  expiresAt: Date | null
  lockTimer: ReturnType<typeof setTimeout> | null
  unlock: (token: string, expiresAt: Date) => void
  lock: () => void
  isUnlocked: () => boolean
}

export const useVaultStore = create<VaultState>()((set, get) => ({
  sessionToken: null,
  expiresAt: null,
  lockTimer: null,

  unlock: (token, expiresAt) => {
    // Clear any existing timer
    const existing = get().lockTimer
    if (existing) clearTimeout(existing)

    const msUntilExpiry = expiresAt.getTime() - Date.now()
    const timer = setTimeout(() => {
      get().lock()
    }, msUntilExpiry)

    set({ sessionToken: token, expiresAt, lockTimer: timer })
  },

  lock: () => {
    const existing = get().lockTimer
    if (existing) clearTimeout(existing)
    set({ sessionToken: null, expiresAt: null, lockTimer: null })
  },

  isUnlocked: () => {
    const { sessionToken, expiresAt } = get()
    if (!sessionToken || !expiresAt) return false
    return expiresAt.getTime() > Date.now()
  },
}))
