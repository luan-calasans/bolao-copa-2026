import { describe, expect, it } from 'vitest'
import type { Match } from '../models/match'
import { canPlaceBet, getBetBlockedMessage, getStatusLabel } from './matchStatus'

function buildMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    utcDate: '2030-06-15T20:00:00.000Z',
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

describe('matchStatus bet acceptance', () => {
  const kickoff = '2026-06-15T20:00:00.000Z'
  const beforeKickoff = new Date('2026-06-15T19:59:59.000Z').getTime()
  const afterKickoff = new Date('2026-06-15T20:00:01.000Z').getTime()

  it('allows betting before kickoff on scheduled matches', () => {
    const match = buildMatch({ utcDate: kickoff })

    expect(canPlaceBet(match, beforeKickoff)).toBe(true)
    expect(getBetBlockedMessage(match, beforeKickoff)).toBeNull()
  })

  it('blocks betting after kickoff on scheduled matches', () => {
    const match = buildMatch({ utcDate: kickoff })

    expect(canPlaceBet(match, afterKickoff)).toBe(false)
    expect(getBetBlockedMessage(match, afterKickoff)).toMatch(/já iniciou/)
  })

  it('allows betting on live matches after kickoff', () => {
    const match = buildMatch({
      utcDate: kickoff,
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
      score: { home: 0, away: 0 },
    })

    expect(canPlaceBet(match, afterKickoff)).toBe(true)
    expect(getBetBlockedMessage(match, afterKickoff)).toBeNull()
  })

  it('blocks betting when teams are not defined', () => {
    const match = buildMatch({
      homeTeam: {
        id: null,
        name: '',
        shortName: '',
        tla: '',
        crest: '',
        isDefined: false,
      },
    })

    expect(canPlaceBet(match, beforeKickoff)).toBe(false)
    expect(getBetBlockedMessage(match, beforeKickoff)).toMatch(/times definidos/)
  })
})

describe('getStatusLabel', () => {
  it('translates normalized scheduled status', () => {
    expect(getStatusLabel('scheduled', null)).toBe('Agendado')
  })
})
