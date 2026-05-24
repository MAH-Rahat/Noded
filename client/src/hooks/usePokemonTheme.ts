import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePokemonStore, POKEMON_TYPE_COLORS, XP_RULES } from '../stores/pokemonStore'

function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const d = (v: number) => Math.max(0, Math.round(v * (1 - factor))).toString(16).padStart(2, '0')
  return `#${d(r)}${d(g)}${d(b)}`
}

export function usePokemonTheme({
  completedToday = 0,
  totalToday = 0,
  streak = 0,
  expenseOnBudget,
}: {
  taskPct?: number
  savingsRate?: number
  streak?: number
  completedToday?: number
  totalToday?: number
  expenseOnBudget?: boolean
} = {}) {
  const { type, xp, pokemonId, addXP, setSprite, spriteUrl, lastXPDate } = usePokemonStore()
  const prevStreakRef = useRef(streak)
  const todayKey = new Date().toISOString().split('T')[0]

  // Apply daily XP — once per day
  useEffect(() => {
    if (lastXPDate === todayKey) return
    let delta = 0
    if (completedToday > 0) delta += completedToday * XP_RULES.taskCompleted
    if (totalToday > 0 && completedToday === totalToday) delta += XP_RULES.allTasksToday
    if (streak > 0) delta += streak * XP_RULES.streakBonus
    else if (prevStreakRef.current > 0 && streak === 0) delta += XP_RULES.missedStreak
    if (expenseOnBudget === true) delta += XP_RULES.expenseOnBudget
    else if (expenseOnBudget === false) delta += XP_RULES.expenseOverBudget
    if (delta !== 0) {
      addXP(delta)
      usePokemonStore.setState({ lastXPDate: todayKey })
    }
    prevStreakRef.current = streak
  }, [todayKey])

  // Fetch sprite
  const { data: pokeData } = useQuery({
    queryKey: ['pokemon', pokemonId],
    queryFn: () => fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`).then(r => r.json()),
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

  // Apply accent color
  const colors = POKEMON_TYPE_COLORS[type] ?? POKEMON_TYPE_COLORS.grass
  useEffect(() => {
    const apply = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
      const hex = isLight ? darkenHex(colors.hex, 0.25) : colors.hex
      document.documentElement.style.setProperty('--color-accent', hex)
      document.documentElement.style.setProperty('--color-accent-glow', colors.glow)
      document.documentElement.style.setProperty('--color-accent-dim', colors.dim)
    }
    apply()
    const obs = new MutationObserver(apply)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [type])

  return { type, xp, colors, spriteUrl }
}
