import raw from './talents.json'
import type { Talent, TreeId, TreeInfo } from '../types'

export const trees = raw.trees as TreeInfo[]
export const talents = raw.talents as Talent[]

export const talentById: Record<string, Talent> = Object.fromEntries(talents.map((t) => [t.id, t]))

export function talentsOfTree(tree: TreeId): Talent[] {
  return talents.filter((t) => t.tree === tree)
}

/** Wowhead's CDN when it knows the icon, otherwise the local copy by file id. */
export function iconUrl(talent: Talent): string {
  return talent.icon
    ? `https://wow.zamimg.com/images/wow/icons/large/${talent.icon}.jpg`
    : `${import.meta.env.BASE_URL}icons/${talent.iconId}.webp`
}

export function specIconUrl(icon: string): string {
  return `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`
}

export function spellUrl(spell: { spellId: number }): string {
  return `https://foreverdb.net/spell/${spell.spellId}`
}
