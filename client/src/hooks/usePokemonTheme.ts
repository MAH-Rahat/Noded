import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  usePokemonStore,
  POKEMON_TYPE_COLORS,
  determineType,
  determineLevel,
  getTierFromXP,
  XP_RULES,
} from '../stores/pokemonStore'

// Darken a hex color by a factor (0–1)
function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const d = (v: number) => Math.max(0, Math.round(v * (1 - factor))).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

interface ThemeInput {
  taskPct: number
  savingsRate: number
  streak: number
  completedToday?: number
  totalToday?: number
  expenseOnBudget?: boolean
}

export function usePokemonTheme({ taskPct, savingsRate, streak, completedToday = 0, totalToday = 0, expenseOnBudget }: ThemeInput) {
  const { type, xp, pokemonId, addXP, setSprite, spriteUrl } = usePokemonStore()
  const prevStreakRef = useRef(streak)
  const prevCompletedRef = useRef(completedToday)
  const prevBudgetRef = useRef(expenseOnBudget)
  const todayKey = new Date().toISOString().split('T')[0]
  const lastXPDate = usePokemonStore(s => s.lastXPDate)

  // Apply daily XP based on activity — only once per day
  useEffect(() => {
    if (lastXPDate === todayKey) return // already applied today
    let delta = 0

    // Task completion XP
    if (completedToday > 0) delta += completedToday * XP_RULES.taskCompleted
    if (totalToday > 0 && completedToday === totalToday) delta += XP_RULES.allTasksToday

    // Streak XP/penalty
    if (streak > 0) delta += streak * XP_RULES.streakBonus
    else if (prevStreakRef.current > 0 && streak === 0) delta += XP_RULES.missedStreak

    // Budget XP/penalty
    if (expenseOnBudget === true) delta += XP_RULES.expenseOnBudget
    else if (expenseOnBudget === false) delta += XP_RULES.expenseOverBudget

    if (delta !== 0) {
      addXP(delta)
      usePokemonStore.setState({ lastXPDate: todayKey })
    }
  }, [todayKey])

  // Fetch sprite from PokéAPI
  const { data: pokeData } = useQuery({
    queryKey: ['pokemon', pokemonId],
    queryFn: () =>
      fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
        .then(r => r.json()),
    staleTime: 1000 * 60 * 60,
    enabled: !!pokemonId,
  })

  useEffect(() => {
    if (pokeData?.sprites?.other?.['official-artwork']?.front_default) {
      setSprite(pokeData.sprites.other['official-artwork'].front_default)
    } else if (pokeData?.sprites?.front_default) {
      setSprite(pokeData.sprites.front_default)
    }
  }, [pokeData])

  // Apply CSS variables — darken accent in light mode for contrast
  const colors = POKEMON_TYPE_COLORS[type] ?? POKEMON_TYPE_COLORS.water
  useEffect(() => {
    const applyColors = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
      const accentHex = isLight ? darkenHex(colors.hex, 0.25) : colors.hex
      document.documentElement.style.setProperty('--color-accent', accentHex)
      document.documentElement.style.setProperty('--color-accent-glow', colors.glow)
      document.documentElement.style.setProperty('--color-accent-dim', colors.dim)
    }
    applyColors()
    const observer = new MutationObserver(applyColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [type])

  const tierInfo = getTierFromXP(xp)
  return { type, xp, tierInfo, colors, spriteUrl }
}
