import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  usePokemonStore,
  POKEMON_TYPE_COLORS,
  determineType,
  determineLevel,
} from '../stores/pokemonStore'

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

  // Apply CSS variables
  const colors = POKEMON_TYPE_COLORS[type] ?? POKEMON_TYPE_COLORS.water
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', colors.hex)
    document.documentElement.style.setProperty('--color-accent-glow', colors.glow)
    document.documentElement.style.setProperty('--color-accent-dim', colors.dim)
  }, [type])

  return { type, level, colors, spriteUrl }
}
