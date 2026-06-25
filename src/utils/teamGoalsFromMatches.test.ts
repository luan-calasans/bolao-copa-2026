import { describe, expect, it } from 'vitest'
import type { Match } from '../models/match'
import { buildTeamGoalsFromMatches } from './teamGoalsFromMatches'

function match(
  id: number,
  home: { id: number; name: string; goals: number },
  away: { id: number; name: string; goals: number },
  status: Match['status'] = 'finished',
): Match {
  return {
    id,
    utcDate: '2026-06-20T18:00:00Z',
    status,
    rawStatus: status.toUpperCase(),
    minute: null,
    venue: null,
    matchday: 1,
    stage: 'GROUP_STAGE',
    group: 'GROUP_A',
    homeTeam: {
      id: home.id,
      name: home.name,
      shortName: home.name.slice(0, 3).toUpperCase(),
      tla: '',
      crest: '',
      isDefined: true,
    },
    awayTeam: {
      id: away.id,
      name: away.name,
      shortName: away.name.slice(0, 3).toUpperCase(),
      tla: '',
      crest: '',
      isDefined: true,
    },
    score: { home: home.goals, away: away.goals },
    halfTimeScore: { home: null, away: null },
    isLive: false,
  }
}

describe('buildTeamGoalsFromMatches', () => {
  it('aggregates goals from finished matches', () => {
    const entries = buildTeamGoalsFromMatches([
      match(1, { id: 10, name: 'Brasil', goals: 2 }, { id: 20, name: 'Argentina', goals: 1 }),
      match(2, { id: 10, name: 'Brasil', goals: 1 }, { id: 30, name: 'Chile', goals: 1 }),
      match(3, { id: 20, name: 'Argentina', goals: 3 }, { id: 30, name: 'Chile', goals: 0 }),
    ])

    expect(entries).toHaveLength(3)
    expect(entries[0]?.team.id).toBe(20)
    expect(entries[0]?.goalsFor).toBe(4)
    expect(entries[0]?.playedGames).toBe(2)
    expect(entries.find((entry) => entry.team.id === 10)?.goalsFor).toBe(3)
    expect(entries.find((entry) => entry.team.id === 30)?.goalsFor).toBe(1)
  })

  it('ignores scheduled and live matches without final score', () => {
    const entries = buildTeamGoalsFromMatches([
      match(1, { id: 10, name: 'Brasil', goals: 2 }, { id: 20, name: 'Argentina', goals: 1 }, 'scheduled'),
      match(2, { id: 10, name: 'Brasil', goals: 1 }, { id: 30, name: 'Chile', goals: 0 }, 'live'),
    ])

    expect(entries).toHaveLength(0)
  })

  it('sorts by goals scored, then goal difference', () => {
    const entries = buildTeamGoalsFromMatches([
      match(1, { id: 10, name: 'Brasil', goals: 2 }, { id: 20, name: 'Argentina', goals: 2 }),
      match(2, { id: 30, name: 'Chile', goals: 3 }, { id: 40, name: 'Uruguai', goals: 0 }),
    ])

    expect(entries[0]?.team.id).toBe(30)
    expect(entries[0]?.goalsFor).toBe(3)
    expect(entries.filter((entry) => entry.goalsFor === 2).map((entry) => entry.team.id).sort()).toEqual([
      10, 20,
    ])
    expect(entries.at(-1)?.team.id).toBe(40)
    expect(entries.at(-1)?.goalsFor).toBe(0)
  })
})
