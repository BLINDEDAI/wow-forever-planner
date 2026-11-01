// Refreshes src/data/leveling-spells.json (ranks, level learned, mana cost and effect of the core
// leveling spells) from talentsforever.com's Priest export (CC BY 4.0).
//   npm run sync:spells            -> shows what would change
//   npm run sync:spells -- --write -> applies it
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE_URL = 'https://talentsforever.com/export/priest.json'
const OUTPUT_PATH = new URL('../src/data/leveling-spells.json', import.meta.url)
const write = process.argv.includes('--write')

// effect: how the number shown in the table is read from the tooltip text.
const CORE_SPELLS = [
  { id: 'smite', name: 'Smite', icon: 'spell_holy_holysmite', kind: 'damage', pattern: /for (\d+) to (\d+) Holy damage/ },
  { id: 'power-word-shield', name: 'Power Word: Shield', icon: 'spell_holy_powerwordshield', kind: 'absorb', pattern: /absorbing (\d+) damage/ },
  { id: 'shadow-word-pain', name: 'Shadow Word: Pain', icon: 'spell_shadow_shadowwordpain', kind: 'damage-over-time', pattern: /causes (\d+) Shadow damage/ },
  { id: 'mind-blast', name: 'Mind Blast', icon: 'spell_shadow_unholyfrenzy', kind: 'damage', pattern: /for (\d+) to (\d+) Shadow damage/ },
  { id: 'devouring-plague', name: 'Devouring Plague', icon: 'spell_shadow_blackplague', kind: 'damage-over-time', pattern: /causes (\d+) Shadow damage/ },
  { id: 'mind-flay', name: 'Mind Flay', icon: 'spell_shadow_siphonmana', kind: 'damage-over-time', pattern: /causing (\d+) Shadow damage/ },
  { id: 'shadow-word-death', name: 'Shadow Word: Death', iconId: '136149', kind: 'damage', pattern: /inflicts (\d+) to (\d+) Shadow damage/ },
]

const response = await fetch(SOURCE_URL)
if (!response.ok) throw new Error(`${SOURCE_URL}: ${response.status}`)
const source = await response.json()

const spells = CORE_SPELLS.map(({ pattern, ...spell }) => {
  const levels = source.spellbook.levels[spell.name]
  if (!levels) throw new Error(`no levels for ${spell.name}`)
  const ranks = levels.map((level, index) => {
    const entry = source.spell_desc[`Priest|${spell.name}|Rank ${index + 1}`]
    if (!entry) throw new Error(`no tooltip for ${spell.name} rank ${index + 1}`)
    const match = entry.d.match(pattern)
    if (!match) throw new Error(`cannot read the effect of ${spell.name} rank ${index + 1}: ${entry.d}`)
    const values = match.slice(1).map(Number)
    const effect = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    const lines = entry.l.flat().filter(Boolean)
    const mana = Number((lines.find((line) => /Mana$/.test(line)) ?? '').replace(/\D/g, '')) || 0
    return { rank: index + 1, level, effect, mana }
  })
  return { ...spell, ranks }
})

const next = JSON.stringify(
  {
    source: `talentsforever.com export/priest.json (CC BY 4.0), WoW Forever beta client build ${source.spellbook.build}`,
    spells,
  },
  null,
  1,
)
const current = (() => {
  try {
    return readFileSync(OUTPUT_PATH, 'utf8')
  } catch {
    return ''
  }
})()

if (current.trim() === next.trim()) {
  console.log('No changes.')
} else if (write) {
  writeFileSync(OUTPUT_PATH, next + '\n')
  console.log('leveling-spells.json updated.')
} else {
  console.log('leveling-spells.json would change. Run with --write to apply.')
}
for (const spell of spells) {
  console.log(`${spell.name}: ${spell.ranks.map((r) => `r${r.rank}@${r.level}`).join(' ')}`)
}
