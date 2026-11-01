// Refreshes src/data/talents.json from ForeverDB's calculator data.
//   npm run sync:talents           -> shows what would change
//   npm run sync:talents -- --write -> applies it
// Spanish text is rebuilt from scripts/translations.es.json (templates with # for each number).
import { readFileSync, writeFileSync } from 'node:fs'

const DATA_URL = 'https://foreverdb.net/data/classes.json'
const TALENTS_PATH = new URL('../src/data/talents.json', import.meta.url)
const TRANSLATIONS_PATH = new URL('./translations.es.json', import.meta.url)
const write = process.argv.includes('--write')
const numberPattern = /\d+(?:\.\d+)?/g

const SECOND_SOURCE_URL = 'https://talentsforever.com/export/priest.json'

const data = JSON.parse(readFileSync(TALENTS_PATH, 'utf8'))
const templates = JSON.parse(readFileSync(TRANSLATIONS_PATH, 'utf8'))

const response = await fetch(DATA_URL)
if (!response.ok) throw new Error(`${DATA_URL}: ${response.status}`)
const priest = (await response.json()).find((c) => c.n === 'Priest')
if (!priest) throw new Error('Priest not found in classes.json')

const remote = new Map(priest.trees.flatMap((tree) => tree.talents.map((t) => [t.sp, t])))
const remoteById = new Map([...remote.values()].map((t) => [t.id, t]))
const slugOf = new Map(data.talents.map((t) => [t.spellId, t.id]))
const changes = []
const needsTranslation = []

for (const talent of data.talents) {
  const source = remote.get(talent.spellId)
  if (!source) {
    changes.push(`${talent.id}: spell ${talent.spellId} no longer in the source`)
    continue
  }
  const next = {
    row: source.row + 1,
    col: source.col,
    maxRank: source.max,
    iconId: String(source.ic),
  }
  const prerequisite = source.pre?.[0] ? slugOf.get(remoteById.get(source.pre[0][0])?.sp) : undefined
  for (const [key, value] of Object.entries(next)) {
    if (talent[key] !== value) {
      changes.push(`${talent.id}: ${key} ${talent[key]} -> ${value}`)
      talent[key] = value
    }
  }
  if (talent.requires !== prerequisite) {
    changes.push(`${talent.id}: requires ${talent.requires ?? 'none'} -> ${prerequisite ?? 'none'}`)
    if (prerequisite) talent.requires = prerequisite
    else delete talent.requires
  }

  const english = source.d.map((text) => text.replace(/\s+/g, ' ').trim())
  const skeleton = (text) => text.replace(numberPattern, '#')
  const template = templates[talent.id]
  if (english.join('|') !== talent.descriptions.en.join('|')) {
    changes.push(`${talent.id}: English text changed`)
    if (skeleton(english[0]) !== skeleton(talent.descriptions.en[0])) needsTranslation.push(talent.id)
  }
  talent.descriptions.en = english
  const placeholders = template ? template.split('#').length - 1 : -1
  if (english.some((text) => (text.match(numberPattern) ?? []).length !== placeholders)) {
    if (!needsTranslation.includes(talent.id)) needsTranslation.push(talent.id)
  } else {
    talent.descriptions.es = english.map((text) => {
      const values = text.match(numberPattern)
      let i = 0
      return template.replace(/#/g, () => values[i++].replace('.', ','))
    })
  }
}

const unknown = [...remote.keys()].filter((spell) => !slugOf.has(spell))
if (unknown.length) changes.push(`new talents in the source (spell ids): ${unknown.join(', ')}`)

console.log(changes.length ? changes.join('\n') : 'No changes in the source.')
if (needsTranslation.length) {
  console.log(`\nNeed a new Spanish template in scripts/translations.es.json: ${needsTranslation.join(', ')}`)
}

await crossCheck(data)

if (write) {
  const head = JSON.stringify({ source: data.source, trees: data.trees }, null, 2).replace(/\n}$/, '')
  const body = data.talents.map((t) => '    ' + JSON.stringify(t)).join(',\n')
  writeFileSync(TALENTS_PATH, `${head},\n  "talents": [\n${body}\n  ]\n}\n`)
  console.log('\ntalents.json updated.')
} else if (changes.length) {
  console.log('\nRun with --write to apply.')
}

// Compares the talents against a second, independent source (read-only, never changes the data).
// Structural differences matter; text differences are often just numbers read at another level.
async function crossCheck(current) {
  console.log('\nCross-check against talentsforever.com (CC BY 4.0)')
  let other
  try {
    const res = await fetch(SECOND_SOURCE_URL)
    if (!res.ok) throw new Error(String(res.status))
    other = await res.json()
  } catch (error) {
    console.log(`  could not read the second source (${error.message}); skipped.`)
    return
  }

  const collapse = (text) => text.replace(/\s+/g, ' ').trim()
  const theirs = other.talents.trees.flatMap((tree) => tree.talents)
  const nameOf = new Map(current.talents.map((t) => [t.id, t.name]))
  const structural = []
  const textual = []

  for (const t of current.talents) {
    const o = theirs.find((x) => x.name === t.name)
    if (!o) {
      structural.push(`${t.name}: missing in the second source`)
      continue
    }
    if (o.row !== t.row) structural.push(`${t.name}: row ${t.row} vs ${o.row}`)
    if (o.col - 1 !== t.col) structural.push(`${t.name}: col ${t.col} vs ${o.col - 1}`)
    if (o.max !== t.maxRank) structural.push(`${t.name}: max rank ${t.maxRank} vs ${o.max}`)
    const requires = t.requires ? nameOf.get(t.requires) : null
    if ((o.req ?? null) !== requires) structural.push(`${t.name}: requires ${requires} vs ${o.req ?? null}`)
    if (o.desc.map(collapse).join('|') !== t.descriptions.en.map(collapse).join('|')) textual.push(t.name)
  }
  for (const o of theirs) {
    if (!current.talents.some((t) => t.name === o.name)) structural.push(`${o.name}: only in the second source`)
  }

  console.log(structural.length ? structural.map((line) => `  ! ${line}`).join('\n') : '  structure matches (rows, columns, ranks, prerequisites)')
  if (textual.length) {
    console.log(`  text differs in ${textual.length} talent(s), often numbers read at another level: ${textual.join(', ')}`)
  }
  console.log(`  second source: ${other.talents.source.slice(0, 120)}…`)
}
