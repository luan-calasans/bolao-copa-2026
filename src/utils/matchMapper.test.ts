import { describe, expect, it } from 'vitest'
import type { Match } from '../models/match'
import { sortTeamMatches } from './matchMapper'

function buildMatch(overrides: Partial<Match> & Pick<Match, 'id' | 'utcDate'>): Match {
  return {
    status: 'scheduled',
    rawStatus: 'SCHEDULED',
    minute: null,
    venue: null,
    matchday: 1,
    stage: 'GROUP_STAGE',
    group: 'GROUP_A',
    homeTeam: {
      id: 1,
      name: 'Brasil',
      shortName: 'Brasil',
      tla: 'BRA',
      crest: '',
      isDefined: true,
    },
    awayTeam: {
      id: 2,
      name: 'Argentina',
      shortName: 'Argentina',
      tla: 'ARG',
      crest: '',
      isDefined: true,
    },
    score: { home: null, away: null },
    halfTimeScore: { home: null, away: null },
    isLive: false,
    ...overrides,
  }
}

describe('sortTeamMatches', () => {
  it('groups scheduled and finished after live matches', () => {
    const finished = buildMatch({
      id: 1,
      utcDate: '2030-06-10T20:00:00.000Z',
      status: 'finished',
      rawStatus: 'FINISHED',
      score: { home: 2, away: 1 },
    })
    const live = buildMatch({
      id: 2,
      utcDate: '2030-06-15T20:00:00.000Z',
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
      score: { home: 1, away: 0 },
    })
    const scheduled = buildMatch({
      id: 3,
      utcDate: '2030-06-20T20:00:00.000Z',
    })

    expect(sortTeamMatches([finished, scheduled, live]).map((match) => match.id)).toEqual([2, 3, 1])
  })

  it('keeps chronological order within the same status', () => {
    const earlier = buildMatch({ id: 10, utcDate: '2030-06-20T16:00:00.000Z' })
    const later = buildMatch({ id: 11, utcDate: '2030-06-22T20:00:00.000Z' })

    expect(sortTeamMatches([later, earlier]).map((match) => match.id)).toEqual([10, 11])
  })
})
