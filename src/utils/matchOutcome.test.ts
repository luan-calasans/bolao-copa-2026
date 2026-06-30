import { describe, expect, it } from 'vitest'
import type { Match } from '../models/match'
import { getTeamMatchOutcome } from './matchOutcome'

function buildMatch(overrides: Partial<Match>): Match {
  return {
    id: 1,
    utcDate: '2030-06-10T20:00:00.000Z',
    status: 'finished',
    rawStatus: 'FINISHED',
    minute: null,
    venue: null,
    matchday: null,
    stage: 'LAST_32',
    group: null,
    homeTeam: {
      id: 1,
      name: 'Netherlands',
      shortName: 'Netherlands',
      tla: 'NED',
      crest: '',
      isDefined: true,
    },
    awayTeam: {
      id: 2,
      name: 'Morocco',
      shortName: 'Morocco',
      tla: 'MAR',
      crest: '',
      isDefined: true,
    },
    score: { home: 1, away: 1 },
    halfTimeScore: { home: 0, away: 0 },
    isLive: false,
    ...overrides,
  }
}

describe('getTeamMatchOutcome', () => {
  it('uses penalty winner when regulation ends in a draw', () => {
    const match = buildMatch({
      penalties: { home: 2, away: 3 },
      winner: 'away',
    })

    expect(getTeamMatchOutcome(match, 'home')).toBe('loss')
    expect(getTeamMatchOutcome(match, 'away')).toBe('win')
  })

  it('uses regulation score when there is a winner in normal time', () => {
    const match = buildMatch({
      score: { home: 2, away: 1 },
      winner: 'home',
    })

    expect(getTeamMatchOutcome(match, 'home')).toBe('win')
    expect(getTeamMatchOutcome(match, 'away')).toBe('loss')
  })
})
