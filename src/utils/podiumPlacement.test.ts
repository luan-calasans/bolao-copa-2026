import { describe, expect, it } from 'vitest'
import {
  getPodiumNameClass,
  getPodiumRankClass,
  getPodiumRowClass,
  isPodiumRank,
} from './podiumPlacement'

describe('podiumPlacement', () => {
  it('detects podium ranks', () => {
    expect(isPodiumRank(1)).toBe(true)
    expect(isPodiumRank(3)).toBe(true)
    expect(isPodiumRank(4)).toBe(false)
  })

  it('returns row classes for the top three positions', () => {
    expect(getPodiumRowClass(1)).toBe('podium-row-first')
    expect(getPodiumRowClass(2)).toBe('podium-row-second')
    expect(getPodiumRowClass(3)).toBe('podium-row-third')
    expect(getPodiumRowClass(4)).toBe('')
  })

  it('returns name and rank color classes', () => {
    expect(getPodiumNameClass(1)).toContain('gold')
    expect(getPodiumNameClass(2)).toContain('slate')
    expect(getPodiumNameClass(3)).toContain('amber')
    expect(getPodiumRankClass(4)).toContain('slate')
  })
})
