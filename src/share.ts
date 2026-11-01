import { talents } from './data/talents'
import { firstInvalidStep } from './planner'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** One character per spent point: the talent's index in the data file. */
export function encodeOrder(order: readonly string[]): string {
  return order
    .map((id) => {
      const index = talents.findIndex((t) => t.id === id)
      return index === -1 ? '' : ALPHABET[index]
    })
    .join('')
}

/** Returns null for anything that is not a valid, rule-abiding order. */
export function decodeOrder(encoded: string): string[] | null {
  const order: string[] = []
  for (const char of encoded) {
    const index = ALPHABET.indexOf(char)
    if (index === -1 || index >= talents.length) return null
    order.push(talents[index].id)
  }
  return firstInvalidStep(order) === -1 ? order : null
}
