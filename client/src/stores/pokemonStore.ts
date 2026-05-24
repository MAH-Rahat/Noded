import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

// ── XP-based evolution chain ──────────────────────────────────────────────────
// One linear chain: evolve as XP grows. No tiers, no ranks.
// XP thresholds: 0→50→150→300→500→750→1000→1500→2000→3000 (10 stages)
export interface EvolutionStage {
  name: string
  id: number
  type: string
  xpRequired: number   // XP needed to reach this stage
  xpToNext: number     // XP needed to evolve to next (0 = final)
  description: string
}

export const EVOLUTION_CHAIN: EvolutionStage[] = [
  { name: 'Bulbasaur',   id: 1,   type: 'grass',    xpRequired: 0,    xpToNext: 50,   description: 'Just starting out — every journey begins with a single step.' },
  { name: 'Ivysaur',     id: 2,   type: 'grass',    xpRequired: 50,   xpToNext: 100,  description: 'Growing stronger — your habits are taking root.' },
  { name: 'Venusaur',    id: 3,   type: 'grass',    xpRequired: 150,  xpToNext: 150,  description: 'Fully bloomed — consistency is your superpower.' },
  { name: 'Charmander',  id: 4,   type: 'fire',     xpRequired: 300,  xpToNext: 200,  description: 'The flame is lit — keep the momentum going.' },
  { name: 'Charmeleon',  id: 5,   type: 'fire',     xpRequired: 500,  xpToNext: 250,  description: 'Burning bright — your discipline is showing.' },
  { name: 'Charizard',   id: 6,   type: 'fire',     xpRequired: 750,  xpToNext: 250,  description: 'Soaring high — you\'ve earned your wings.' },
  { name: 'Squirtle',    id: 7,   type: 'water',    xpRequired: 1000, xpToNext: 500,  description: 'Steady flow — you\'re building solid foundations.' },
  { name: 'Wartortle',   id: 8,   type: 'water',    xpRequired: 1500, xpToNext: 500,  description: 'Flowing with purpose — your balance is impressive.' },
  { name: 'Blastoise',   id: 9,   type: 'water',    xpRequired: 2000, xpToNext: 1000, description: 'Unstoppable force — your consistency is legendary.' },
  { name: 'Mewtwo',      id: 150, type: 'psychic',  xpRequired: 3000, xpToNext: 0,    description: 'Transcendent — you\'ve mastered the art of balance.' },
]

export function getPokemonForXP(xp: number): EvolutionStage {
  const clamped = Math.max(0, xp)
  // Find the highest stage the user has reached
  let current = EVOLUTION_CHAIN[0]
  for (const stage of EVOLUTION_CHAIN) {
    if (clamped >= stage.xpRequired) current = stage
    else break
  }
  return current
}

export function getXPProgress(xp: number): { current: EvolutionStage; xpInStage: number; xpForNext: number; progressPct: number } {
  const stage = getPokemonForXP(xp)
  const xpInStage = xp - stage.xpRequired
  const xpForNext = stage.xpToNext
  const progressPct = xpForNext > 0 ? Math.min(100, Math.round((xpInStage / xpForNext) * 100)) : 100
  return { current: stage, xpInStage, xpForNext, progressPct }
}

// XP gains and losses per action
export const XP_RULES = {
  taskCompleted:    +15,  // Complete a task
  allTasksToday:    +25,  // Complete ALL tasks for the day
  streakBonus:      +5,   // Per day of active streak
  missedStreak:     -20,  // Break a streak
  expenseOnBudget:  +10,  // Monthly expenses within budget
  expenseOverBudget:-15,  // Monthly expenses over budget
}

interface PokemonState {
  type: string
  xp: number
  pokemonName: string
  pokemonId: number
  spriteUrl: string | null
  description: string
  lastXPDate: string
  addXP: (amount: number) => void
  setSprite: (url: string) => void
}

export const usePokemonStore = create<PokemonState>()(
  persist(
    (set, get) => ({
      type: 'grass',
      xp: 0,
      pokemonName: 'Bulbasaur',
      pokemonId: 1,
      spriteUrl: null,
      description: 'Just starting out — every journey begins with a single step.',
      lastXPDate: '',

      addXP: (amount) => {
        const newXP = Math.max(0, get().xp + amount)
        const stage = getPokemonForXP(newXP)
        set({ xp: newXP, type: stage.type, pokemonName: stage.name, pokemonId: stage.id, description: stage.description })
      },
      setSprite: (url) => set({ spriteUrl: url }),
    }),
    {
      name: 'noded-pokemon',
      // Reset XP on store version change
      version: 2,
      migrate: () => ({
        type: 'grass', xp: 0, pokemonName: 'Bulbasaur', pokemonId: 1,
        spriteUrl: null, description: 'Just starting out.', lastXPDate: '',
      }),
    }
  )
)
