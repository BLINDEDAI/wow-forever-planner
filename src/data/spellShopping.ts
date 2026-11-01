import raw from './spell-shopping.json'
import { specIconUrl } from './talents'

export type ShoppingVerdict = 'buy' | 'nuance' | 'skip'

export interface ShoppingSpell {
  id: string
  name: string
  verdict: ShoppingVerdict
  /** Wowhead icon name. */
  icon?: string
  /** File data id, served from public/icons when Wowhead has no icon. */
  iconId?: string
  note: string
}

export const shopping = {
  video: raw.video,
  saving: raw.saving,
  spells: raw.spells as ShoppingSpell[],
}

export function shoppingIconUrl(spell: ShoppingSpell): string {
  return spell.icon
    ? specIconUrl(spell.icon)
    : `${import.meta.env.BASE_URL}icons/${spell.iconId}.webp`
}
