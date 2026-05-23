import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Official Pokémon type colors (canonical palette)
export const POKEMON_TYPE_COLORS: Record<string, { hex: string; glow: string; dim: string; name: string }> = {
  normal:   { hex: '#A8A878', glow: 'rgba(168,168,120,0.35)', dim: 'rgba(168,168,120,0.12)', name: 'Normal' },
  fire:     { hex: '#EE8130', glow: 'rgba(238,129,48,0.4)',   dim: 'rgba(238,129,48,0.14)',  name: 'Fire' },
  water:    { hex: '#6390F0', glow: 'rgba(99,144,240,0.4)',   dim: 'rgba(99,144,240,0.14)',  name: 'Water' },
  electric: { hex: '#F7D02C', glow: 'rgba(247,208,44,0.4)',   dim: 'rgba(247,208,44,0.14)',  name: 'Electric' },
  grass:    { hex: '#7AC74C', glow: 'rgba(122,199,76,0.4)',   dim: 'rgba(122,199,76,0.14)',  name: 'Grass' },
  ice:      { hex: '#96D9D6', glow: 'rgba(150,217,214,0.4)',  dim: 'rgba(150,217,214,0.14)', name: 'Ice' },
  fighting: { hex: '#C22E28', glow: 'rgba(194,46,40,0.4)',    dim: 'rgba(194,46,40,0.14)',   name: 'Fighting' },
  poison:   { hex: '#A33EA1', glow: 'rgba(163,62,161,0.4)',   dim: 'rgba(163,62,161,0.14)',  name: 'Poison' },
  ground:   { hex: '#E2BF65', glow: 'rgba(226,191,101,0.4)',  dim: 'rgba(226,191,101,0.14)', name: 'Ground' },
  flying:   { hex: '#A98FF3', glow: 'rgba(169,143,243,0.4)',  dim: 'rgba(169,143,243,0.14)', name: 'Flying' },
  psychic:  { hex: '#F95587', glow: 'rgba(249,85,135,0.4)',   dim: 'rgba(249,85,135,0.14)',  name: 'Psychic' },
  bug:      { hex: '#A6B91A', glow: 'rgba(166,185,26,0.4)',   dim: 'rgba(166,185,26,0.14)',  name: 'Bug' },
  rock:     { hex: '#B6A136', glow: 'rgba(182,161,54,0.4)',   dim: 'rgba(182,161,54,0.14)',  name: 'Rock' },
  ghost:    { hex: '#735797', glow: 'rgba(115,87,151,0.4)',   dim: 'rgba(115,87,151,0.14)',  name: 'Ghost' },
  dragon:   { hex: '#6F35FC', glow: 'rgba(111,53,252,0.4)',   dim: 'rgba(111,53,252,0.14)',  name: 'Dragon' },
  dark:     { hex: '#705746', glow: 'rgba(112,87,70,0.4)',    dim: 'rgba(112,87,70,0.14)',   name: 'Dark' },
  steel:    { hex: '#B7B7CE', glow: 'rgba(183,183,206,0.4)',  dim: 'rgba(183,183,206,0.14)', name: 'Steel' },
  fairy:    { hex: '#D685AD', glow: 'rgba(214,133,173,0.4)',  dim: 'rgba(214,133,173,0.14)', name: 'Fairy' },
}

// Determine Pokémon type from user stats
export function determineType(taskPct: number, savingsRate: number): string {
  // Savings rate drives primary type
  if (savingsRate < 0)   return 'fire'      // Overspending — burning money
  if (savingsRate < 10)  return 'fighting'  // Struggling
  if (savingsRate < 20)  return 'grass'     // Growing slowly
  if (savingsRate < 30)  return 'water'     // Flowing, balanced
  if (savingsRate < 40)  return 'electric'  // Energetic, building up
  if (savingsRate < 55)  return 'dragon'    // Powerful, ambitious
  if (savingsRate < 70)  return 'psychic'   // Highly strategic
  return 'steel'                            // Fortress-level savings
}

// Determine level from task completion history
export function determineLevel(streak: number, taskPct: number): number {
  const base = Math.min(streak * 3, 60)
  const bonus = Math.round(taskPct * 0.4)
  return Math.max(1, Math.min(100, base + bonus))
}

// Pick a Pokémon name for the type (iconic representative)
export const TYPE_POKEMON: Record<string, { name: string; id: number; description: string }> = {
  normal:   { name: 'Snorlax',    id: 143, description: 'Steady and reliable — you keep things moving at your own pace.' },
  fire:     { name: 'Charizard',  id: 6,   description: 'Burning through budget — channel that fire into income!' },
  water:    { name: 'Vaporeon',   id: 134, description: 'Fluid and adaptable — your finances flow with purpose.' },
  electric: { name: 'Jolteon',    id: 135, description: 'High energy, fast growth — you\'re charging up fast.' },
  grass:    { name: 'Leafeon',    id: 470, description: 'Steady growth, rooted habits — keep nurturing your goals.' },
  ice:      { name: 'Glaceon',    id: 471, description: 'Cool and calculated — your discipline is your strength.' },
  fighting: { name: 'Machamp',    id: 68,  description: 'You\'re in the grind — every rep counts, keep pushing.' },
  poison:   { name: 'Gengar',     id: 94,  description: 'Sneaky expenses creeping in — time to audit the budget.' },
  ground:   { name: 'Garchomp',   id: 445, description: 'Grounded and powerful — solid foundation, big moves.' },
  flying:   { name: 'Dragonite',  id: 149, description: 'Soaring above average — your potential is sky-high.' },
  psychic:  { name: 'Alakazam',   id: 65,  description: 'Strategic genius — you\'re playing 4D chess with your finances.' },
  bug:      { name: 'Scizor',     id: 212, description: 'Precise and efficient — small wins compound into big results.' },
  rock:     { name: 'Tyranitar',  id: 248, description: 'Unshakeable — your consistency is your superpower.' },
  ghost:    { name: 'Gengar',     id: 94,  description: 'Mysterious patterns — dig into where your money disappears.' },
  dragon:   { name: 'Dragonite',  id: 149, description: 'Legendary status — you\'re building something extraordinary.' },
  dark:     { name: 'Umbreon',    id: 197, description: 'Patient and strategic — you play the long game.' },
  steel:    { name: 'Metagross',  id: 376, description: 'Iron discipline — your financial fortress is impenetrable.' },
  fairy:    { name: 'Sylveon',    id: 700, description: 'Charming and balanced — you make it look effortless.' },
}

interface PokemonState {
  type: string
  level: number
  pokemonName: string
  pokemonId: number
  spriteUrl: string | null
  description: string
  lastUpdated: number
  setProfile: (type: string, level: number) => void
  setSprite: (url: string) => void
}

export const usePokemonStore = create<PokemonState>()(
  persist(
    (set) => ({
      type: 'water',
      level: 1,
      pokemonName: 'Vaporeon',
      pokemonId: 134,
      spriteUrl: null,
      description: 'Fluid and adaptable.',
      lastUpdated: 0,

      setProfile: (type, level) => {
        const poke = TYPE_POKEMON[type] ?? TYPE_POKEMON.water
        set({ type, level, pokemonName: poke.name, pokemonId: poke.id, description: poke.description, lastUpdated: Date.now() })
      },
      setSprite: (url) => set({ spriteUrl: url }),
    }),
    { name: 'noded-pokemon' }
  )
)
