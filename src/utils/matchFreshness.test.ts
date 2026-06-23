import { describe, expect, it } from 'vitest'
import type { Match } from '../models/match'
import {
  mergeMatchesWithOverrides,
  pickFresherMatch,
  upliftKickoffPassedMatch,
} from './matchFreshness'

function buildMatch(overrides: Partial<Match> & Pick<Match, 'id'>): Match {
  return {
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
    lastUpdated: null,
    ...overrides,
  }
}

describe('pickFresherMatch', () => {
  it('prefers finished over stale live from bulk list', () => {
    const bulk = buildMatch({
      id: 10,
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
      score: { home: 2, away: 1 },
    })
    const individual = buildMatch({
      id: 10,
      status: 'finished',
      rawStatus: 'FINISHED',
      isLive: false,
      score: { home: 2, away: 1 },
    })

    expect(pickFresherMatch(bulk, individual)).toEqual(individual)
  })

  it('uses lastUpdated when both matches share the same live state', () => {
    const older = buildMatch({
      id: 11,
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
      minute: 70,
      lastUpdated: '2030-06-15T21:10:00.000Z',
    })
    const newer = buildMatch({
      id: 11,
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
      minute: 72,
      lastUpdated: '2030-06-15T21:12:00.000Z',
    })

    expect(pickFresherMatch(older, newer)).toEqual(newer)
  })

  it('prefers live bulk list over stale scheduled cache', () => {
    const bulk = buildMatch({
      id: 12,
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
      minute: 12,
    })
    const cached = buildMatch({
      id: 12,
      status: 'scheduled',
      rawStatus: 'SCHEDULED',
      isLive: false,
    })

    expect(pickFresherMatch(bulk, cached)).toEqual(bulk)
  })
})

describe('upliftKickoffPassedMatch', () => {
  it('uplifts scheduled matches after kickoff for display', () => {
    const scheduled = buildMatch({
      id: 13,
      utcDate: '2030-06-15T18:00:00.000Z',
    })

    const uplifted = upliftKickoffPassedMatch(scheduled, Date.parse('2030-06-15T19:00:00.000Z'))

    expect(uplifted.status).toBe('live')
    expect(uplifted.isLive).toBe(true)
    expect(uplifted.rawStatus).toBe('IN_PLAY')
  })
})

describe('mergeMatchesWithOverrides', () => {
  it('replaces only overridden match ids', () => {
    const bulkLive = buildMatch({
      id: 1,
      status: 'live',
      rawStatus: 'IN_PLAY',
      isLive: true,
    })
    const bulkScheduled = buildMatch({ id: 2, utcDate: '2030-06-16T20:00:00.000Z' })
    const verified = buildMatch({
      id: 1,
      status: 'finished',
      rawStatus: 'FINISHED',
      isLive: false,
      score: { home: 1, away: 0 },
    })

    const merged = mergeMatchesWithOverrides(
      [bulkLive, bulkScheduled],
      new Map([[1, verified]]),
    )

    expect(merged[0]).toEqual(verified)
    expect(merged[1]).toEqual(bulkScheduled)
  })
})
