import { describe, expect, it } from 'vitest'
import { getBetScore as getSharedBetScore } from '../../shared/betScoring.js'
import type { Match } from '../models/match'
import { getBetScore, SCORING_RULES } from './betScoring'

describe('betScoring', () => {
  it('matches the shared scoring module', () => {
    const match: Pick<Match, 'status' | 'score'> = {
      status: 'finished',
      score: { home: 2, away: 1 },
    }

    expect(getBetScore(match, 3, 1)).toEqual(getSharedBetScore(match, 3, 1))
  })

  it('exposes scoring rules for the ranking screen', () => {
    expect(SCORING_RULES).toHaveLength(3)
    expect(SCORING_RULES[0]?.title).toContain('Placar exato')

    const partialGroup = SCORING_RULES[1]
    expect(partialGroup && 'items' in partialGroup).toBe(true)
    if (partialGroup && 'items' in partialGroup) {
      expect(partialGroup.title).toContain('Acerto parcial')
      expect(partialGroup.items[0]?.title).toContain('Placar')
      expect(partialGroup.items[1]?.title).toContain('Quem vence')
    }
  })
})
