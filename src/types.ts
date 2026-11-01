export type TreeId = 'discipline' | 'holy' | 'shadow'

export interface Talent {
  id: string
  name: string
  tree: TreeId
  /** 1-based tier; tier N needs (N - 1) * 5 points spent in the rows above it. */
  row: number
  /** 0-based grid column. */
  col: number
  maxRank: number
  spellId: number
  /** Wowhead icon name, or null when the source has no icon for this talent. */
  icon: string | null
  /** File data id of the icon, served from public/icons when the Wowhead name is missing. */
  iconId: string
  /** Effect text per rank (index 0 = rank 1): English from the beta client, Spanish translated from it. */
  descriptions: { en: string[]; es: string[] }
  /** Talent that must be at max rank before this one can take points. */
  requires?: string
}

export interface TreeInfo {
  id: TreeId
  name: string
  /** Wowhead icon name of the specialization. */
  icon: string
}

export interface PlanState {
  ranks: Record<string, number>
  total: number
}

export interface Build {
  id: string
  name: string
  order: string[]
  /** Free text about the whole build. */
  notes?: string
  /** Short notes keyed by the level of the step they belong to. */
  levelNotes?: Record<string, string>
}

export type RacialKind = 'racial' | 'passive' | 'class-spell'

export interface Racial {
  id: string
  name: string
  kind: RacialKind
  spellId: number
  /** File data id of the icon, served from public/icons. */
  iconId: string
  /** Level at which a trainer teaches it, for class spells. */
  level?: number
  /** Cost, cast time and cooldown line. */
  details?: string
  description: string
  note?: string
}
