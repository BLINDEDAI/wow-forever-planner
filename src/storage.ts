import { firstInvalidStep } from './planner'
import type { Build } from './types'

const STORAGE_KEY = 'wow-forever-planner.builds.v1'

function isStringRecord(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((text) => typeof text === 'string')
  )
}

function isBuild(value: unknown): value is Build {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    Array.isArray(candidate.order) &&
    candidate.order.every((id) => typeof id === 'string') &&
    firstInvalidStep(candidate.order as string[]) === -1 &&
    (candidate.notes === undefined || typeof candidate.notes === 'string') &&
    (candidate.levelNotes === undefined || isStringRecord(candidate.levelNotes))
  )
}

export function loadBuilds(): Build[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isBuild) : []
  } catch {
    return []
  }
}

export function saveBuilds(builds: Build[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds))
  } catch {
    // Storage can be blocked or full; the planner keeps working in memory.
  }
}
