import raw from './gear.json'

export type GearSpec = 'shadow' | 'discipline' | 'holy'
export type Difficulty = 'easy' | 'some' | 'hard' | 'unknown'
export type GearSlotKey =
  | 'head' | 'neck' | 'shoulder' | 'back' | 'chest' | 'wrist' | 'hands' | 'waist' | 'legs' | 'feet'
  | 'finger' | 'trinket' | 'mainHand' | 'offHand' | 'ranged'

export interface GearEntry {
  id: number
  score: number
  stats: string
  source: string
  kind: string
  difficulty: Difficulty
  effort: string
  faction?: 'Horde' | 'Alliance'
  hordeName?: string
  /** [item id, percent worse than the best pick]. */
  alternatives?: [number, number][]
  enchant?: string
  enchantUpgradeLevel?: number
}

export interface GearItem {
  name: string
  quality: number
  requiredLevel: number
  icon: number
}

export interface AlternativeSource {
  text: string
  kind: string
  faction?: 'Horde' | 'Alliance'
}

export interface GearSlot {
  key: GearSlotKey
  label: string
  entry: GearEntry | null
  item: GearItem | null
  alternatives: { id: number; item: GearItem | null; percent: number; source: AlternativeSource | null }[]
}

export const gearSpecs: { value: GearSpec; label: string }[] = [
  { value: 'shadow', label: 'Sombras' },
  { value: 'discipline', label: 'Disciplina' },
  { value: 'holy', label: 'Sagrado' },
]

export const GEAR_FIRST_LEVEL = 10
export const GEAR_LAST_LEVEL = 60

const slotOrder: { key: GearSlotKey; label: string }[] = [
  { key: 'head', label: 'Cabeza' },
  { key: 'neck', label: 'Cuello' },
  { key: 'shoulder', label: 'Hombros' },
  { key: 'back', label: 'Espalda' },
  { key: 'chest', label: 'Pecho' },
  { key: 'wrist', label: 'Muñecas' },
  { key: 'hands', label: 'Manos' },
  { key: 'waist', label: 'Cintura' },
  { key: 'legs', label: 'Piernas' },
  { key: 'feet', label: 'Pies' },
  { key: 'finger', label: 'Anillo' },
  { key: 'trinket', label: 'Abalorio' },
  { key: 'mainHand', label: 'Mano derecha' },
  { key: 'offHand', label: 'Mano izquierda' },
  { key: 'ranged', label: 'Varita' },
]

const specs = raw.specs as unknown as Record<GearSpec, Partial<Record<GearSlotKey, [number, number, GearEntry][]>>>
const items = raw.items as unknown as Record<string, GearItem>
const alternativeSources = raw.alternativeSources as unknown as Record<string, AlternativeSource>

export const gearSource = raw.source

export function gearItem(id: number): GearItem | null {
  return items[String(id)] ?? null
}

/** The recommended item for every slot at a level; slots with no pick keep `entry: null`. */
export function gearAt(spec: GearSpec, level: number): GearSlot[] {
  return slotOrder.map(({ key, label }) => {
    const entry = specs[spec][key]?.find(([from, to]) => level >= from && level <= to)?.[2] ?? null
    return {
      key,
      label,
      entry,
      item: entry ? gearItem(entry.id) : null,
      alternatives: (entry?.alternatives ?? []).map(([id, percent]) => ({
        id,
        item: gearItem(id),
        percent,
        source: alternativeSources[String(id)] ?? null,
      })),
    }
  })
}

export function itemIconUrl(item: GearItem): string {
  return `${import.meta.env.BASE_URL}gear-icons/${item.icon}.webp`
}

export function itemUrl(id: number): string {
  return `https://foreverdb.net/item/${id}`
}
