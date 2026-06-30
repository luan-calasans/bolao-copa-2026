import { describe, expect, it } from 'vitest'
import { getSideMatches } from '../components/knockout/knockoutBracketLayout'
import type { KnockoutMatch } from '../models/knockout'
import { buildRoundOf32Fixtures } from './knockoutBracketTemplate'

function toKnockoutMatch(matchId: string, key: string): KnockoutMatch {
  return {
    key,
    matchId,
    stage: 'LAST_32',
    home: { team: null, label: matchId, isProjected: true },
    away: { team: null, label: matchId, isProjected: true },
    score: { home: null, away: null },
    status: 'scheduled',
    utcDate: null,
    isProjected: true,
  }
}

describe('knockout bracket display order', () => {
  it('places left and right sides in the official 2026 layout', () => {
    const matches = buildRoundOf32Fixtures().map((fixture) =>
      toKnockoutMatch(fixture.matchId, fixture.key),
    )

    const left = getSideMatches(matches, 'left').map((match) => match.matchId)
    const right = getSideMatches(matches, 'right').map((match) => match.matchId)

    expect(left).toEqual([
      'M74',
      'M77',
      'M73',
      'M75',
      'M83',
      'M84',
      'M81',
      'M82',
    ])

    expect(right).toEqual([
      'M76',
      'M78',
      'M79',
      'M80',
      'M86',
      'M88',
      'M85',
      'M87',
    ])
  })
})
