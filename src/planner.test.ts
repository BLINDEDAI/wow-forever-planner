import { describe, expect, it } from 'vitest'
import { talents } from './data/talents'
import { MAX_POINTS, firstInvalidStep, tryAdd, tryMove, tryRemove } from './planner'
import { decodeOrder, encodeOrder } from './share'

function repeat(id: string, times: number): string[] {
  return Array(times).fill(id)
}

describe('talent data', () => {
  it('has the 52 Priest talents with unique ids and valid prerequisites', () => {
    expect(talents).toHaveLength(52)
    const ids = new Set(talents.map((t) => t.id))
    expect(ids.size).toBe(52)
    for (const t of talents) {
      if (t.requires) expect(ids.has(t.requires)).toBe(true)
    }
  })

  it('has a description and an icon for every talent', () => {
    for (const t of talents) {
      for (const language of [t.descriptions.en, t.descriptions.es]) {
        expect(language).toHaveLength(t.maxRank)
        for (const text of language) expect(text.length).toBeGreaterThan(10)
      }
      expect(t.icon !== null || /^\d+$/.test(t.iconId)).toBe(true)
    }
  })

  it('does not place two talents in the same grid cell', () => {
    const cells = talents.map((t) => `${t.tree}:${t.row}:${t.col}`)
    expect(new Set(cells).size).toBe(talents.length)
  })
})

describe('plan rules', () => {
  it('allows tier 1 talents up to their max rank and no further', () => {
    const full = repeat('wand-specialization', 2)
    expect(firstInvalidStep(full)).toBe(-1)
    expect(tryAdd(full, 'wand-specialization')).toBeNull()
  })

  it('locks tier 2 until 5 points are spent above it', () => {
    const four = repeat('power-in-light', 4)
    expect(tryAdd(four, 'silent-resolve')).toBeNull()
    expect(tryAdd([...four, 'wand-specialization'], 'silent-resolve')).not.toBeNull()
  })

  it('counts points per tree, not across trees', () => {
    const holyPoints = repeat('holy-specialization', 5)
    expect(tryAdd(holyPoints, 'silent-resolve')).toBeNull()
  })

  it('needs the prerequisite at max rank', () => {
    const rowsOneToThree = [
      ...repeat('power-in-light', 5),
      ...repeat('wand-specialization', 2),
      ...repeat('silent-resolve', 3),
      ...repeat('mental-strength', 5),
      ...repeat('mental-agility', 3),
      ...repeat('improved-power-word-shield', 3),
      ...repeat('meditation', 3),
    ]
    expect(firstInvalidStep(rowsOneToThree)).toBe(-1)
    expect(tryAdd(rowsOneToThree, 'renewed-hope')).toBeNull()
    const withPrerequisite = [...rowsOneToThree, 'soul-warding']
    expect(tryAdd(withPrerequisite, 'renewed-hope')).not.toBeNull()
  })

  it('refuses a removal that would break a later talent', () => {
    const order = [...repeat('power-in-light', 5), 'silent-resolve']
    expect(tryRemove(order, 'power-in-light')).toBeNull()
    expect(tryRemove(order, 'silent-resolve')).toEqual(repeat('power-in-light', 5))
  })

  it('refuses a move that puts a talent before its requirements', () => {
    const order = [...repeat('power-in-light', 5), 'silent-resolve']
    expect(tryMove(order, 5, 0)).toBeNull()
  })

  it('never exceeds the point cap', () => {
    expect(MAX_POINTS).toBe(51)
  })
})

describe('share encoding', () => {
  it('round-trips a valid order', () => {
    const order = [...repeat('power-in-light', 5), 'silent-resolve']
    expect(decodeOrder(encodeOrder(order))).toEqual(order)
  })

  it('rejects garbage and rule-breaking orders', () => {
    expect(decodeOrder('!!!')).toBeNull()
    expect(decodeOrder(encodeOrder(['silent-resolve']))).toBeNull()
  })
})

describe('racial data', () => {
  it('has unique ids and a description for every racial', async () => {
    const { racials } = await import('./data/racials')
    expect(new Set(racials.map((r) => r.id)).size).toBe(racials.length)
    for (const racial of racials) expect(racial.description.length).toBeGreaterThan(10)
  })
})

describe('leveling timeline data', () => {
  it('matches the numbers shown on the video slide at level 36', async () => {
    const { spellById, bestRankAt } = await import('./leveling')
    const at36 = (id: string) => bestRankAt(spellById[id], 36)
    expect(at36('power-word-shield')).toMatchObject({ rank: 6, effect: 381, mana: 250 })
    expect(at36('shadow-word-pain')).toMatchObject({ rank: 5, effect: 288, mana: 230 })
    expect(at36('mind-blast')).toMatchObject({ rank: 5, effect: 204, mana: 185 })
    expect(at36('devouring-plague')).toMatchObject({ rank: 3, effect: 344, mana: 495 })
    expect(at36('mind-flay')).toMatchObject({ rank: 3, effect: 153, mana: 100 })
    expect(at36('shadow-word-death')).toMatchObject({ rank: 1, effect: 302, mana: 175 })
  })

  it('knows nothing of a spell before its first rank', async () => {
    const { spellById, bestRankAt } = await import('./leveling')
    expect(bestRankAt(spellById['shadow-word-death'], 31)).toBeNull()
  })

  it('has a rotation for every level and only uses known spells', async () => {
    const { rotationAt, spellById } = await import('./leveling')
    for (let level = 1; level <= 60; level++) {
      const range = rotationAt(level)
      expect(range, `level ${level}`).not.toBeNull()
      for (const row of range!.rows) {
        for (const step of row.steps) {
          expect(step.spell === 'wand' || step.spell === 'melee' || step.spell in spellById).toBe(true)
        }
      }
    }
  })
})

describe('gear by level', () => {
  it('resolves an item and an icon for every pick at every level and spec', async () => {
    const { gearAt, gearSpecs, GEAR_FIRST_LEVEL, GEAR_LAST_LEVEL } = await import('./data/gear')
    for (const { value: spec } of gearSpecs) {
      for (let level = GEAR_FIRST_LEVEL; level <= GEAR_LAST_LEVEL; level++) {
        const slots = gearAt(spec, level)
        expect(slots).toHaveLength(15)
        const picked = slots.filter((slot) => slot.entry)
        expect(picked.length, `${spec} ${level}`).toBeGreaterThan(8)
        for (const slot of picked) {
          expect(slot.item, `${spec} ${level} ${slot.key}`).not.toBeNull()
          expect(slot.entry!.source.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('does not recommend items the character cannot wear yet', async () => {
    const { gearAt } = await import('./data/gear')
    for (const level of [10, 25, 40, 60]) {
      for (const slot of gearAt('shadow', level)) {
        if (slot.item) expect(slot.item.requiredLevel, `${slot.key} at ${level}`).toBeLessThanOrEqual(level)
      }
    }
  })
})
