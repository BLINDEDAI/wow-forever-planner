import raw from './racials.json'
import type { Racial } from '../types'

export const race = raw.race
export const racials = raw.racials as Racial[]

export function racialIconUrl(racial: Racial): string {
  return `${import.meta.env.BASE_URL}icons/${racial.iconId}.webp`
}
