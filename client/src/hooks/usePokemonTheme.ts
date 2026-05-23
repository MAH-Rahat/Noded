import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  usePokemonStore,
  POKEMON_TYPE_COLORS,
  determineType,
  determineLevel,
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
}

export function usePokemonTheme({ taskPct, savingsRate, streak }: ThemeInput) {
  const { type, level, pokemonId, setProfile, setSprite, spriteUrl } = usePokemonStore()

  // Recalculate profile when stats change
  useEffect(() => {
    const newType = determineType(taskPct, savingsRate)
    const newLevel = determineLevel(streak, taskPct)
    setProfile(newType, newLevel)
  }, [taskPct, savingsRate, streak])

  // Fetch sprite from PokéAPI
  const { data: pokeData } = useQuery({
    queryKey: ['pokemon', pokemonId],
    queryFn: () =>
      fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
        .then(r => r.json()),
    staleTime: 1000 * 60 * 60, // 1 hour
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
    // Re-apply when theme attribute changes
    const observer = new MutationObserver(applyColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [type])

  return { type, level, colors, spriteUrl }
}
