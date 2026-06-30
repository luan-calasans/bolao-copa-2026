import { describe, expect, it } from 'vitest'
import { groupCodeFromKey, isSameGroup, toGroupKey } from './knockoutBracketTemplate'
import { buildGroupSnapshots, isGroupStageComplete } from './knockoutQualifiers'
import { generateRoundOf32 } from './roundOf32Generator'
import { getVisibleStandings, resolveGroupStandings } from './standingsBuilder'
import type { ApiStandingTable } from '../models/api.types'

function createApiStyleStanding(group: string): ApiStandingTable {
  return {
    stage: 'ALL',
    type: 'TOTAL',
    group,
    table: [
      {
        position: 1,
        team: { id: 1, name: 'Líder', shortName: 'Líder', tla: 'LID', crest: null },
        playedGames: 3,
        won: 3,
        draw: 0,
        lost: 0,
        points: 9,
        goalsFor: 4,
        goalsAgainst: 1,
        goalDifference: 3,
      },
      {
        position: 2,
        team: { id: 2, name: 'Vice', shortName: 'Vice', tla: 'VIC', crest: null },
        playedGames: 3,
        won: 1,
        draw: 1,
        lost: 1,
        points: 4,
        goalsFor: 3,
        goalsAgainst: 3,
        goalDifference: 0,
      },
      {
        position: 3,
        team: { id: 3, name: 'Terceiro', shortName: 'Terceiro', tla: 'TER', crest: null },
        playedGames: 3,
        won: 1,
        draw: 0,
        lost: 2,
        points: 3,
        goalsFor: 2,
        goalsAgainst: 4,
        goalDifference: -2,
      },
      {
        position: 4,
        team: { id: 4, name: 'Último', shortName: 'Último', tla: 'ULT', crest: null },
        playedGames: 3,
        won: 0,
        draw: 1,
        lost: 2,
        points: 1,
        goalsFor: 1,
        goalsAgainst: 3,
        goalDifference: -2,
      },
    ],
  }
}

describe('groupCodeFromKey', () => {
  it('parses football-data.org group labels', () => {
    expect(groupCodeFromKey('Group A')).toBe('A')
    expect(groupCodeFromKey('GROUP_B')).toBe('B')
    expect(groupCodeFromKey('group_l')).toBe('L')
    expect(isSameGroup('Group A', 'GROUP_A')).toBe(true)
    expect(toGroupKey('C')).toBe('GROUP_C')
  })
})

describe('standings with API group format', () => {
  it('recognizes and resolves Group A–L standings from the API', () => {
    const standings = 'ABCDEFGHIJKL'.split('').map((letter) => createApiStyleStanding(`Group ${letter}`))

    expect(getVisibleStandings(standings)).toHaveLength(12)
    expect(isGroupStageComplete(standings)).toBe(true)

    const resolved = resolveGroupStandings(standings, [])
    expect(resolved[0]?.group).toBe('GROUP_A')

    const snapshots = buildGroupSnapshots(resolved)
    expect(snapshots.find((entry) => entry.group === 'A')?.second?.team.name).toBe('Vice')

    const m73 = generateRoundOf32(resolved).find((match) => match.matchId === 'M73')
    expect(m73?.homeLabel).toBe('Vice')
    expect(m73?.awayLabel).toBe('Vice')
  })
})
