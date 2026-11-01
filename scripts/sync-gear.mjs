// Builds src/data/gear.json from the ForeverDB "best in slot" pages (Priest, leveling mode,
// levels 10-60, three specs) plus its item dataset (icon, quality, required level).
//
// Usage: node scripts/sync-gear.mjs [--cache <dir>]
//   --cache keeps the downloaded pages in <dir> so the parser can be rerun without hitting the site.
// Spanish text is produced here with templates; item and NPC names stay in English on purpose.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cacheIdx = process.argv.indexOf('--cache')
const cacheDir = cacheIdx > 0 ? resolve(process.argv[cacheIdx + 1]) : null
if (cacheDir) mkdirSync(cacheDir, { recursive: true })

const SPECS = ['shadow', 'discipline', 'holy']
const FIRST_LEVEL = 10
const LAST_LEVEL = 60
const BASE = 'https://foreverdb.net'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchText(url, cacheName) {
  const file = cacheDir && join(cacheDir, cacheName)
  if (file && existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(url, { headers: { 'user-agent': 'wow-forever-planner-sync (personal tool)' } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  const text = await res.text()
  if (file) writeFileSync(file, text)
  await sleep(300)
  return text
}

const decode = (s) =>
  s.replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

const SLOT_KEYS = {
  Head: 'head', Neck: 'neck', Shoulder: 'shoulder', Back: 'back', Chest: 'chest', Wrist: 'wrist',
  Hands: 'hands', Waist: 'waist', Legs: 'legs', Feet: 'feet', Finger: 'finger', Trinket: 'trinket',
  'Main hand': 'mainHand', 'Off hand': 'offHand', 'Ranged or relic': 'ranged',
}

const PROFESSIONS = {
  Tailoring: 'Sastrería', Enchanting: 'Encantamiento', Engineering: 'Ingeniería', Leatherworking: 'Peletería',
  Blacksmithing: 'Herrería', Alchemy: 'Alquimia', Mining: 'Minería', Skinning: 'Desuello', Herbalism: 'Herboristería',
}
const REPUTATION = { Friendly: 'Amistoso', Honored: 'Honrado', Revered: 'Reverenciado', Exalted: 'Exaltado' }
const CONFIDENCE = { 'Seen in Forever': 'visto en Forever', 'Clue, unconfirmed': 'sin confirmar' }

function stats(en) {
  return en
    .replace(/set bonus share: /g, 'bonus de set ')
    .replace(/([\d.]+) wand DPS/g, 'varita $1 DPS')
    .replace(/\+(\d+) mana per 5 sec/g, '+$1 maná cada 5 seg')
    .replace(/\+(\d+) Shadow Damage Done/g, '+$1 daño de Sombras')
    .replace(/\+(\d+) spell power/g, '+$1 poder de hechizo')
    .replace(/\+(\d+) spell damage/g, '+$1 daño de hechizo')
    .replace(/\+(\d+) healing/g, '+$1 sanación')
    .replace(/\+(\d+) Stamina/g, '+$1 aguante')
    .replace(/\+(\d+) Intellect/g, '+$1 intelecto')
    .replace(/\+(\d+) Spirit/g, '+$1 espíritu')
    .replace(/\+(\d+) Agility/g, '+$1 agilidad')
    .replace(/\+(\d+) Strength/g, '+$1 fuerza')
    .replace(/\+(\d+) hit/g, '+$1 impacto')
    .replace(/\+(\d+) crit/g, '+$1 crítico')
    .replace(/(\d+) armor/g, '$1 armadura')
}

function confidence(note) {
  if (!note || /Classic data|Forever client/.test(note)) return ''
  return CONFIDENCE[note] ? ` (${CONFIDENCE[note]})` : ''
}

function source(en) {
  let m
  if ((m = en.match(/^Crafted: (\w+) (\d+)/))) {
    return { kind: 'crafted', text: `Fabricado con ${PROFESSIONS[m[1]] ?? m[1]} (habilidad ${m[2]})` }
  }
  if ((m = en.match(/^Drops from (.+?)(?:, ([\d.]+)%)?(?: \(([^)]*)\))?$/))) {
    const chance = m[2] ? `, ${m[2].replace('.', ',')}%` : ''
    let where = m[1]
    const trash = where.match(/^trash in (.+)$/)
    const inZone = where.match(/^(.+?) in (.+)$/)
    let text
    if (trash) text = `Cae de enemigos normales en ${trash[1]}`
    else if (inZone) text = `Cae de ${inZone[1]} en ${inZone[2]}`
    else if (/^NPC \d+$/.test(where)) text = `Cae de un enemigo aún sin nombre (${where})`
    else text = `Cae de ${where}`
    return { kind: 'drop', text: `${text}${chance}${confidence(m[3])}` }
  }
  if ((m = en.match(/^Sold by (.+?) in (.+?)(?: \(([\d.]+), ([\d.]+)\))? for ([\dgsc ]+?)(?: \(([^)]*)\))?$/))) {
    const coords = m[3] ? ` (${m[3].replace('.', ',')}; ${m[4].replace('.', ',')})` : ''
    return { kind: 'vendor', text: `Se compra a ${m[1]} en ${m[2]}${coords} por ${m[5]}${confidence(m[6])}` }
  }
  if ((m = en.match(/^Quest reward: (.+?)(?: \(a choice\))?, level (\d+)(?: · (Horde|Alliance))?(?: \(([^)]*)\))?$/))) {
    const choice = / \(a choice\)/.test(en) ? ' (a elegir)' : ''
    const faction = m[3] ? (m[3] === 'Horde' ? ' · solo Horda' : ' · solo Alianza') : ''
    return {
      kind: 'quest',
      faction: m[3] ?? null,
      text: `Recompensa de la misión ${m[1]}${choice}, nivel ${m[2]}${faction}${confidence(m[4])}`,
    }
  }
  if (/^World drop/.test(en)) return { kind: 'world', text: 'Botín aleatorio del mundo: cae de enemigos al azar' }
  if ((m = en.match(/^Needs (\w+) with (.+?)(?: \(([^)]*)\))?$/))) {
    const who = /isn't known yet/.test(m[3] ?? '') ? '; aún no se sabe quién lo vende' : ''
    return { kind: 'reputation', text: `Requiere reputación ${REPUTATION[m[1]] ?? m[1]} con ${m[2]}${who}` }
  }
  if ((m = en.match(/^Inside (.+?)(?: \(.*\))?$/))) return { kind: 'container', text: `Dentro de un cofre: ${m[1]}` }
  if ((m = en.match(/^Found in (.+?)(?: \(.*\))?$/))) return { kind: 'container', text: `Se encuentra en ${m[1]}` }
  if (/^Where it comes from isn't known yet/.test(en)) return { kind: 'unknown', text: 'Todavía no se sabe de dónde sale' }
  return { kind: 'other', text: en }
}

const DIFFICULTY = { Easy: 'easy', 'Some effort': 'some', Hard: 'hard', 'Not known': 'unknown' }

function effort(en) {
  let m
  if (en === 'buy it') return 'comprarlo'
  if (en === 'craft it or buy it from a crafter') return 'fabricarlo o comprárselo a un artesano'
  if (en === 'a quest reward') return 'recompensa de misión'
  if ((m = en.match(/^about (\d+) runs?$/))) return `unas ${m[1]} vueltas a la mazmorra`
  if (en === 'farm the creature') return 'farmear a la criatura'
  if (en === 'a dungeon drop, chance not known yet') return 'botín de mazmorra, probabilidad aún desconocida'
  if (en === 'random luck') return 'pura suerte'
  if (en === 'drops every run') return 'cae en cada vuelta'
  if (en === 'a raid drop') return 'botín de banda'
  if (en === 'open the container') return 'abrir el contenedor'
  if ((m = en.match(/^(\w+) with (.+)$/)) && REPUTATION[m[1]]) return `reputación ${REPUTATION[m[1]]} con ${m[2]}`
  if (/where it comes from isn't known yet/.test(en)) return 'origen desconocido'
  return en
}

const SOURCE_START = /(Crafted: |Drops from |Sold by |Quest reward: |World drop|Found in |Inside |Needs |Where it comes from)/

function parseEntry(li) {
  const slotName = li.match(/<b>([^<]+)<\/b>/)?.[1]
  const slot = SLOT_KEYS[slotName]
  const itemId = li.match(/<a href="\/item\/(\d+)">/)?.[1]
  if (!slot || !itemId) return null

  const alternatives = [...(li.split('Next best:')[1] ?? '').matchAll(/<a href="\/item\/(\d+)">[^<]*<\/a> \(−(\d+)% vs best\)/g)].map(
    (m) => [Number(m[1]), Number(m[2])],
  )

  const text = decode(li.replace(/<[^>]+>/g, ''))
  const head = text.match(/^[^:]+: (.+?), score ([\d.]+): (.*)$/)
  if (!head) return null
  const rest = head[3]
  const diff = rest.match(/(Easy|Some effort|Hard|Not known): (.*?)\.(?= |$)/)
  if (!diff) return null
  const before = rest.slice(0, diff.index).replace(/Learn it at skill \d+\.\s*/, '')
  const cut = before.search(SOURCE_START)
  const statsEn = (cut > 0 ? before.slice(0, cut) : before).trim().replace(/\.$/, '')
  const sourceEn = cut >= 0 ? before.slice(cut).trim().replace(/\.$/, '') : ''
  const after = rest.slice(diff.index + diff[0].length)
  const ench = after.match(/Enchant or enhancement: (.+?)(?: \(|, )/)?.[1]
  const enchLevel = after.match(/A better one comes at level (\d+)/)?.[1]

  const src = source(sourceEn)
  const entry = {
    id: Number(itemId),
    score: Number(head[2]),
    stats: stats(statsEn),
    source: src.text,
    kind: src.kind,
    difficulty: DIFFICULTY[diff[1]],
    effort: effort(diff[2]),
  }
  const horde = text.match(/\(Horde: ([^)]+)\)/)?.[1]
  if (horde) entry.hordeName = horde
  if (src.faction) entry.faction = src.faction
  if (alternatives.length) entry.alternatives = alternatives
  if (ench) entry.enchant = ench
  if (ench && enchLevel) entry.enchantUpgradeLevel = Number(enchLevel)
  return { slot, entry }
}

const specs = {}
const usedIds = new Set()
const altIds = new Set()
let unparsed = 0
for (const spec of SPECS) {
  const perSlot = {}
  for (let level = FIRST_LEVEL; level <= LAST_LEVEL; level++) {
    const html = await fetchText(`${BASE}/bis/priest/${spec}?mode=lvl&lvl=${level}`, `${spec}_${level}.html`)
    const list = html.match(/Every slot<\/h2><ul class="ssr-list">([\s\S]*?)<\/ul>/)?.[1]
    if (!list) throw new Error(`No slot list for ${spec} level ${level}`)
    for (const li of list.split('</li>')) {
      if (!li.trim()) continue
      const parsed = parseEntry(li)
      if (!parsed) {
        if (/<a href="\/item\//.test(li)) unparsed++
        continue
      }
      usedIds.add(parsed.entry.id)
      parsed.entry.alternatives?.forEach(([id]) => {
        usedIds.add(id)
        altIds.add(id)
      })
      ;(perSlot[parsed.slot] ??= []).push({ level, entry: parsed.entry })
    }
  }
  // Consecutive levels with the same pick collapse into one run: [from, to, entry].
  specs[spec] = Object.fromEntries(
    Object.entries(perSlot).map(([slot, rows]) => {
      const runs = []
      for (const { level, entry } of rows) {
        const last = runs[runs.length - 1]
        if (last && last[1] === level - 1 && JSON.stringify(last[2]) === JSON.stringify(entry)) last[1] = level
        else runs.push([level, level, entry])
      }
      return [slot, runs]
    }),
  )
  console.log(spec, Object.values(specs[spec]).reduce((n, runs) => n + runs.length, 0), 'runs')
}

// Item pages list their sources in a different wording from the best-in-slot pages.
function alternativeSource(html) {
  const block = html.match(/<h2>Where to get it<\/h2>([\s\S]*?)(?:<h2|<p class="ssr-data)/)?.[1] ?? ''
  const first = block.match(/<li>([\s\S]*?)<\/li>/)?.[1]
  if (!first) return { kind: 'unknown', text: 'Todavía no se sabe de dónde sale' }
  const en = decode(first.replace(/<[^>]+>/g, ''))
  let m
  if ((m = en.match(/^Quest reward from (.+?) \(level (\d+)\)(?:, a choice of rewards)?(?:, (Horde|Alliance))?(?: \(([^)]*)\))?$/))) {
    const faction = m[3] ? (m[3] === 'Horde' ? ' · solo Horda' : ' · solo Alianza') : ''
    const choice = /a choice of rewards/.test(en) ? ' (a elegir)' : ''
    return {
      kind: 'quest',
      faction: m[3] ?? null,
      text: `Recompensa de la misión ${m[1]}${choice}, nivel ${m[2]}${faction}${confidence(m[4])}`,
    }
  }
  if ((m = en.match(/^Crafted with (\w+)/))) return { kind: 'crafted', text: `Fabricado con ${PROFESSIONS[m[1]] ?? m[1]}` }
  if ((m = en.match(/^Drops from (.+?)(?: \((boss|rare)\))?(?: in (.+?))?(?:, ([\d.]+)%)?(?: \(([^)]*)\))?$/))) {
    const rank = m[2] === 'boss' ? ' (jefe)' : m[2] === 'rare' ? ' (élite raro)' : ''
    const zone = m[3] ? ` en ${m[3]}` : ''
    const chance = m[4] ? `, ${m[4].replace('.', ',')}%` : ''
    return { kind: 'drop', text: `Cae de ${m[1]}${rank}${zone}${chance}${confidence(m[5])}` }
  }
  if ((m = en.match(/^Sold by (.+?)(?: \(([^)]*)\))?$/))) {
    return { kind: 'vendor', text: `Se compra a ${m[1]}${confidence(m[2])}` }
  }
  if (/^World drop/.test(en)) return { kind: 'world', text: 'Botín aleatorio del mundo: cae de enemigos al azar' }
  if ((m = en.match(/^Inside (.+?)(?: \(.*\))?$/))) return { kind: 'container', text: `Dentro de un cofre: ${m[1]}` }
  if ((m = en.match(/^Found in (.+?)(?: \(.*\))?$/))) return { kind: 'container', text: `Se encuentra en ${m[1]}` }
  if (/isn't known yet/.test(en)) return { kind: 'unknown', text: 'Todavía no se sabe de dónde sale' }
  return { kind: 'other', text: en }
}

const alternativeSources = {}
for (const id of [...altIds].sort((a, b) => a - b)) {
  const src = alternativeSource(await fetchText(`${BASE}/item/${id}`, `item_${id}.html`))
  alternativeSources[id] = src.faction ? { text: src.text, kind: src.kind, faction: src.faction } : { text: src.text, kind: src.kind }
}
console.log('alternative sources', Object.keys(alternativeSources).length)

const dataset = JSON.parse(await fetchText(`${BASE}/data/items.json`, 'items.json'))
const items = {}
for (const it of dataset) {
  if (usedIds.has(it.id)) items[it.id] = { name: it.n, quality: it.q, requiredLevel: it.rl, icon: it.ic }
}
const missing = [...usedIds].filter((id) => !items[id])
if (missing.length) console.warn('Items missing from the dataset:', missing.join(', '))
if (unparsed) console.warn(`${unparsed} entries could not be parsed`)

const out = {
  source: 'ForeverDB best in slot (foreverdb.net/bis/priest), leveling mode, levels 10-60; provisional beta data',
  specs,
  items,
  alternativeSources,
}
writeFileSync(join(root, 'src/data/gear.json'), JSON.stringify(out))
console.log('items', Object.keys(items).length, 'bytes', JSON.stringify(out).length)
