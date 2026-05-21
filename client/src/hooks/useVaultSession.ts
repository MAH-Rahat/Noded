import { useVaultStore } from '../stores/vaultStore'

export function useVaultSession() {
  const { sessionToken, expiresAt, unlock, lock, isUnlocked } = useVaultStore()

  return {
    sessionToken,
    expiresAt,
    isUnlocked: isUnlocked(),
    unlock,
    lock,
  }
}
