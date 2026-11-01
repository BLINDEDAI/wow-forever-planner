import { talentById, talents } from './data/talents'
import type { PlanState, Talent, TreeId } from './types'

export const MAX_POINTS = 51
/** Level at which the first talent point is earned. */
export const FIRST_LEVEL = 10
export const MAX_LEVEL = FIRST_LEVEL + MAX_POINTS - 1
const POINTS_PER_ROW = 5

export function levelOfStep(stepIndex: number): number {
  return FIRST_LEVEL + stepIndex
}

export function emptyState(): PlanState {
  return { ranks: {}, total: 0 }
}

export function pointsInTree(state: PlanState, tree: TreeId): number {
  return talents.reduce((sum, t) => (t.tree === tree ? sum + (state.ranks[t.id] ?? 0) : sum), 0)
}

function pointsAboveRow(state: PlanState, tree: TreeId, row: number): number {
  return talents.reduce(
    (sum, t) => (t.tree === tree && t.row < row ? sum + (state.ranks[t.id] ?? 0) : sum),
    0,
  )
}

export function rowRequirement(talent: Talent): number {
  return (talent.row - 1) * POINTS_PER_ROW
}

export function canAdd(state: PlanState, talent: Talent): boolean {
  if (state.total >= MAX_POINTS) return false
  if ((state.ranks[talent.id] ?? 0) >= talent.maxRank) return false
  if (pointsAboveRow(state, talent.tree, talent.row) < rowRequirement(talent)) return false
  if (talent.requires) {
    const prerequisite = talentById[talent.requires]
    if ((state.ranks[prerequisite.id] ?? 0) < prerequisite.maxRank) return false
  }
  return true
}

export function buildState(order: readonly string[], steps: number = order.length): PlanState {
  const state = emptyState()
  for (const id of order.slice(0, steps)) {
    state.ranks[id] = (state.ranks[id] ?? 0) + 1
    state.total += 1
  }
  return state
}

/** Index of the first step that breaks a rule, or -1 when the whole order is valid. */
export function firstInvalidStep(order: readonly string[]): number {
  const state = emptyState()
  for (let i = 0; i < order.length; i++) {
    const talent = talentById[order[i]]
    if (!talent || !canAdd(state, talent)) return i
    state.ranks[talent.id] = (state.ranks[talent.id] ?? 0) + 1
    state.total += 1
  }
  return -1
}

export function tryAdd(order: readonly string[], talentId: string): string[] | null {
  const next = [...order, talentId]
  return firstInvalidStep(next) === -1 ? next : null
}

/** Removes the latest point spent in the talent, if everything after it stays valid. */
export function tryRemove(order: readonly string[], talentId: string): string[] | null {
  const index = order.lastIndexOf(talentId)
  if (index === -1) return null
  const next = order.filter((_, i) => i !== index)
  return firstInvalidStep(next) === -1 ? next : null
}

export function tryMove(order: readonly string[], from: number, to: number): string[] | null {
  if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return null
  const next = [...order]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return firstInvalidStep(next) === -1 ? next : null
}

export function tryRemoveStep(order: readonly string[], stepIndex: number): string[] | null {
  if (stepIndex < 0 || stepIndex >= order.length) return null
  const next = order.filter((_, i) => i !== stepIndex)
  return firstInvalidStep(next) === -1 ? next : null
}
