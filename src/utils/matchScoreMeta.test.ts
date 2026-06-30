import { describe, expect, it } from 'vitest'
import type { Match } from '../models/match'
import { buildMatchScoreMetaLine } from './matchScoreMeta'

function buildMatch(overrides: Partial<Match>): Match {
  return {
    id: 537415,
    utcDate: '2026-06-30T01:00:00Z',
    status: 'finished',
    rawStatus: 'FINISHED',
    minute: null,
    venue: null,
    matchday: null,
    stage: 'LAST_32',
    group: null,
    homeTeam: {
      id: 1,
      name: 'Germany',
      shortName: 'Germany',
      tla: 'GER',
      crest: '',
      isDefined: true,
    },
    awayTeam: {
      id: 2,
      name: 'Paraguay',
      shortName: 'Paraguay',
      tla: 'PAR',
      crest: '',
      isDefined: true,
    },
    score: { home: 1, away: 1 },
    halfTimeScore: { home: 0, away: 1 },
    penalties: { home: 3, away: 4 },
    isLive: false,
    ...overrides,
  }
}

describe('buildMatchScoreMetaLine', () => {
  it('joins penalties and half time on one line', () => {
    const line = buildMatchScoreMetaLine(buildMatch({}), true)

    expect(line).toBe('Pênaltis 3 × 4 | Intervalo 0 × 1')
  })

  it('shows only half time when there is no secondary score', () => {
    const line = buildMatchScoreMetaLine(
      buildMatch({ penalties: null, score: { home: 2, away: 1 } }),
      true,
    )

    expect(line).toBe('Intervalo 0 × 1')
  })

  it('returns null when there is nothing to show', () => {
    expect(buildMatchScoreMetaLine(buildMatch({ penalties: null }), false)).toBeNull()
  })
})
