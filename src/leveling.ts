import spellsRaw from './data/leveling-spells.json'
import eventsRaw from './data/leveling-events.json'

export type EffectKind = 'damage' | 'damage-over-time' | 'absorb'

export interface SpellRank {
  rank: number
  level: number
  effect: number
  mana: number
}

export interface CoreSpell {
  id: string
  name: string
  /** Wowhead icon name. */
  icon?: string
  /** File data id, served from public/icons when Wowhead has no icon. */
  iconId?: string
  kind: EffectKind
  ranks: SpellRank[]
}

export interface LevelNote {
  level: number
  text: string
  /** Extra lines shown under the text (steps, options). */
  details?: string[]
}

export interface RotationStep {
  /** A core spell id, "wand" or "melee". */
  spell: string
  times?: number
}

export interface RotationRow {
  label: string
  sub?: string
  steps: RotationStep[]
}

export interface RotationRange {
  from: number
  to: number
  rows: RotationRow[]
}

export const MIN_LEVEL = 1
export const MAX_LEVEL = 60

export const coreSpells = spellsRaw.spells as CoreSpell[]
export const wandEvents = eventsRaw.wands as LevelNote[]
export const talentEvents = eventsRaw.talents as LevelNote[]
export const rotationUpdates = eventsRaw.rotationUpdates as LevelNote[]
const rotations = eventsRaw.rotations as RotationRange[]

export const eventsSource = { video: 'https://www.youtube.com/watch?v=wVU59PWpeMc' }

export const spellById: Record<string, CoreSpell> = Object.fromEntries(coreSpells.map((s) => [s.id, s]))

/** The highest rank of the spell learnable at that level, or null if it is not known yet. */
export function bestRankAt(spell: CoreSpell, level: number): SpellRank | null {
  return [...spell.ranks].reverse().find((rank) => rank.level <= level) ?? null
}

export function newRanksAt(level: number): { spell: CoreSpell; rank: SpellRank }[] {
  return coreSpells.flatMap((spell) =>
    spell.ranks.filter((rank) => rank.level === level).map((rank) => ({ spell, rank })),
  )
}

export function notesAt(notes: LevelNote[], level: number): LevelNote[] {
  return notes.filter((note) => note.level === level)
}

export function rotationAt(level: number): RotationRange | null {
  return rotations.find((range) => level >= range.from && level <= range.to) ?? null
}

/** Levels that have something to show, for the timeline markers. */
export interface LevelMarkers {
  ranks: { spell: CoreSpell; rank: SpellRank }[]
  wands: LevelNote[]
  talents: LevelNote[]
  rotation: LevelNote[]
}

export function markersAt(level: number): LevelMarkers {
  return {
    ranks: newRanksAt(level),
    wands: notesAt(wandEvents, level),
    talents: notesAt(talentEvents, level),
    rotation: notesAt(rotationUpdates, level),
  }
}
