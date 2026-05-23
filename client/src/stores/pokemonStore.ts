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

// ── Ranked tier system ────────────────────────────────────────────────────────
// Tiers: Bronze 1-3, Silver 1-3, Gold 1-3, Platinum 1-3, Diamond 1-3, Master
export const TIERS = [
  { name: 'Bronze',   divisions: 3, color: '#CD7F32' },
  { name: 'Silver',   divisions: 3, color: '#C0C0C0' },
  { name: 'Gold',     divisions: 3, color: '#FFD700' },
  { name: 'Platinum', divisions: 3, color: '#00E5FF' },
  { name: 'Diamond',  divisions: 3, color: '#B9F2FF' },
  { name: 'Master',   divisions: 1, color: '#FF6B6B' },
]

// Total XP thresholds per tier-division (100 XP per division, 300 per tier)
const XP_PER_DIVISION = 100
const TOTAL_DIVISIONS = TIERS.reduce((s, t) => s + t.divisions, 0) // 16

export function getTierFromXP(xp: number): { tierName: string; division: number; tierColor: string; xpInDivision: number; xpForNext: number; totalXP: number } {
  const clampedXP = Math.max(0, xp)
  let remaining = clampedXP
  for (const tier of TIERS) {
    for (let d = tier.divisions; d >= 1; d--) {
      if (remaining < XP_PER_DIVISION || (tier.name === 'Master' && d === 1)) {
        return {
          tierName: tier.name,
          division: d,
          tierColor: tier.color,
          xpInDivision: Math.min(remaining, XP_PER_DIVISION),
          xpForNext: XP_PER_DIVISION,
          totalXP: clampedXP,
        }
      }
      remaining -= XP_PER_DIVISION
    }
  }
  // Max rank
  return { tierName: 'Master', division: 1, tierColor: '#FF6B6B', xpInDivision: XP_PER_DIVISION, xpForNext: XP_PER_DIVISION, totalXP: clampedXP }
}

// XP gains and losses
export const XP_RULES = {
  taskCompleted: +15,       // Complete a task
  streakBonus: +5,          // Per day of streak (applied daily)
  allTasksToday: +25,       // Complete ALL tasks for the day
  missedStreak: -20,        // Break a streak (miss a day)
  highPriorityMissed: -10,  // High priority task overdue 2+ days
  expenseOnBudget: +10,     // Monthly expenses within budget
  expenseOverBudget: -15,   // Monthly expenses over budget
  noteCreated: +5,          // Create a note
}

// Determine Pokémon type from XP tier
export function determineTypeFromTier(tierName: string): string {
  const map: Record<string, string> = {
    Bronze: 'fighting', Silver: 'water', Gold: 'electric',
    Platinum: 'psychic', Diamond: 'dragon', Master: 'fairy',
  }
  return map[tierName] ?? 'water'
}

// Legacy: keep for backward compat
export function determineType(taskPct: number, savingsRate: number): string {
  if (savingsRate < 0)   return 'fire'
  if (savingsRate < 10)  return 'fighting'
  if (savingsRate < 20)  return 'grass'
  if (savingsRate < 30)  return 'water'
  if (savingsRate < 40)  return 'electric'
  if (savingsRate < 55)  return 'dragon'
  if (savingsRate < 70)  return 'psychic'
  return 'steel'
}

export function determineLevel(streak: number, taskPct: number): number {
  const base = Math.min(streak * 3, 60)
  const bonus = Math.round(taskPct * 0.4)
  return Math.max(1, Math.min(100, base + bonus))
}

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
  xp: number
  pokemonName: string
  pokemonId: number
  spriteUrl: string | null
  description: string
  lastUpdated: number
  lastXPDate: string  // YYYY-MM-DD — track daily XP to avoid double-counting
  setProfile: (type: string, level: number) => void
  setSprite: (url: string) => void
  addXP: (amount: number) => void
  setXP: (xp: number) => void
}

export const usePokemonStore = create<PokemonState>()(
  persist(
    (set, get) => ({
      type: 'water',
      level: 1,
      xp: 0,
      pokemonName: 'Vaporeon',
      pokemonId: 134,
      spriteUrl: null,
      description: 'Fluid and adaptable.',
      lastUpdated: 0,
      lastXPDate: '',

      setProfile: (type, level) => {
        const poke = TYPE_POKEMON[type] ?? TYPE_POKEMON.water
        set({ type, level, pokemonName: poke.name, pokemonId: poke.id, description: poke.description, lastUpdated: Date.now() })
      },
      setSprite: (url) => set({ spriteUrl: url }),
      addXP: (amount) => {
        const newXP = Math.max(0, get().xp + amount)
        const tier = getTierFromTier(newXP)
        const newType = determineTypeFromTier(tier)
        const poke = TYPE_POKEMON[newType] ?? TYPE_POKEMON.water
        set({ xp: newXP, type: newType, pokemonName: poke.name, pokemonId: poke.id, description: poke.description, lastUpdated: Date.now() })
      },
      setXP: (xp) => {
        const newXP = Math.max(0, xp)
        const tier = getTierFromTier(newXP)
        const newType = determineTypeFromTier(tier)
        const poke = TYPE_POKEMON[newType] ?? TYPE_POKEMON.water
        set({ xp: newXP, type: newType, pokemonName: poke.name, pokemonId: poke.id, description: poke.description })
      },
    }),
    { name: 'noded-pokemon' }
  )
)

function getTierFromTier(xp: number): string {
  return getTierFromXP(xp).tierName
}
