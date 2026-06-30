import { describe, expect, it } from 'vitest'
import type { ApiMatch } from '../models/api.types'
import type { Match } from '../models/match'
import { formatScoreDisplay, mapApiMatchToMatch, sortTeamMatches } from './matchMapper'

function buildApiMatch(score: ApiMatch['score'], overrides: Partial<ApiMatch> = {}): ApiMatch {
  return {
    id: 537418,
    utcDate: '2026-06-30T01:00:00Z',
    status: 'FINISHED',
    minute: null,
    venue: 'Estadio BBVA',
    matchday: null,
    stage: 'LAST_32',
    group: null,
    homeTeam: {
      id: 8601,
      name: 'Netherlands',
      shortName: 'Netherlands',
      tla: 'NED',
      crest: 'https://crests.football-data.org/8601.svg',
    },
    awayTeam: {
      id: 815,
      name: 'Morocco',
      shortName: 'Morocco',
      tla: 'MAR',
      crest: 'https://crests.football-data.org/morocco.svg',
    },
    score,
    ...overrides,
  }
}

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

describe('mapApiMatchToMatch', () => {
  it('uses regularTime instead of fullTime when penalties inflate the API fullTime score', () => {
    const match = mapApiMatchToMatch(
      buildApiMatch({
        winner: 'AWAY_TEAM',
        duration: 'PENALTY_SHOOTOUT',
        fullTime: { home: 3, away: 4 },
        halfTime: { home: 0, away: 0 },
        regularTime: { home: 1, away: 1 },
        extraTime: { home: 0, away: 0 },
        penalties: { home: 2, away: 3 },
      }),
    )

    expect(match.score).toEqual({ home: 1, away: 1 })
    expect(match.penalties).toEqual({ home: 2, away: 3 })
    expect(match.winner).toBe('away')
  })

  it('falls back to fullTime when regularTime is absent', () => {
    const match = mapApiMatchToMatch(
      buildApiMatch({
        winner: 'HOME_TEAM',
        duration: 'REGULAR',
        fullTime: { home: 2, away: 0 },
        halfTime: { home: 1, away: 0 },
      }),
    )

    expect(match.score).toEqual({ home: 2, away: 0 })
    expect(match.penalties).toBeNull()
  })
})

describe('formatScoreDisplay', () => {
  it('shows regulation and penalty scores separately', () => {
    const match = buildMatch({
      id: 1,
      utcDate: '2030-06-10T20:00:00.000Z',
      status: 'finished',
      rawStatus: 'FINISHED',
      score: { home: 1, away: 1 },
      penalties: { home: 2, away: 3 },
    })

    expect(formatScoreDisplay(match)).toBe('1 × 1 · Pênaltis 2 × 3')
  })
})

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
