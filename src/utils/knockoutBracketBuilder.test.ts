import { describe, expect, it } from 'vitest'
import type { ApiStandingTable } from '../models/api.types'
import { buildKnockoutBracket } from './knockoutBracketBuilder'
import {
  buildGroupSnapshots,
  getQualifiedThirdGroups,
  isGroupStageComplete,
  rankThirdPlaceTeams,
} from './knockoutQualifiers'
import { R32_TEMPLATE } from './knockoutBracketTemplate'

function createRow(
  position: number,
  team: { id: number; name: string; shortName?: string },
  stats: { points: number; gd: number; gf: number; played?: number },
) {
  return {
    position,
    team: {
      id: team.id,
      name: team.name,
      shortName: team.shortName ?? team.name,
      tla: team.name.slice(0, 3).toUpperCase(),
      crest: null,
    },
    playedGames: stats.played ?? 3,
    won: 0,
    draw: 0,
    lost: 0,
    points: stats.points,
    goalsFor: stats.gf,
    goalsAgainst: stats.gf - stats.gd,
    goalDifference: stats.gd,
  }
}

function createGroupStanding(group: string, teams: Array<ReturnType<typeof createRow>>): ApiStandingTable {
  return {
    stage: 'GROUP_STAGE',
    type: 'TOTAL',
    group,
    table: teams,
  }
}

describe('knockoutQualifiers', () => {
  it('ranks third-place teams by points, goal difference and goals for', () => {
    const standings = [
      createGroupStanding('GROUP_A', [
        createRow(1, { id: 1, name: 'Brasil' }, { points: 9, gd: 4, gf: 5 }),
        createRow(2, { id: 2, name: 'Croácia' }, { points: 4, gd: 0, gf: 3 }),
        createRow(3, { id: 3, name: 'Marrocos' }, { points: 4, gd: 1, gf: 3 }),
        createRow(4, { id: 4, name: 'Canadá' }, { points: 3, gd: -1, gf: 2 }),
      ]),
      createGroupStanding('GROUP_B', [
        createRow(1, { id: 5, name: 'França' }, { points: 7, gd: 3, gf: 4 }),
        createRow(2, { id: 6, name: 'Alemanha' }, { points: 5, gd: 1, gf: 4 }),
        createRow(3, { id: 7, name: 'Japão' }, { points: 3, gd: 0, gf: 2 }),
        createRow(4, { id: 8, name: 'Peru' }, { points: 1, gd: -2, gf: 1 }),
      ]),
    ]

    const snapshots = buildGroupSnapshots(standings)
    const ranked = rankThirdPlaceTeams(snapshots)

    expect(ranked[0]?.team.id).toBe(3)
    expect(ranked[1]?.team.id).toBe(7)
    expect(getQualifiedThirdGroups(snapshots).size).toBe(2)
  })

  it('detects completed group stage when all teams played 3 matches', () => {
    const standings = [
      createGroupStanding('GROUP_A', [
        createRow(1, { id: 1, name: 'Brasil' }, { points: 9, gd: 4, gf: 5, played: 3 }),
        createRow(2, { id: 2, name: 'Croácia' }, { points: 4, gd: 0, gf: 3, played: 3 }),
        createRow(3, { id: 3, name: 'Marrocos' }, { points: 4, gd: 1, gf: 3, played: 3 }),
        createRow(4, { id: 4, name: 'Canadá' }, { points: 3, gd: -1, gf: 2, played: 3 }),
      ]),
    ]

    expect(isGroupStageComplete(standings)).toBe(true)
  })
})

describe('knockoutBracketBuilder', () => {
  it('builds 16 projected round-of-32 matches from standings', () => {
    const standings = ['A', 'B'].flatMap((letter, groupIndex) => {
      const base = groupIndex * 4
      return [
        createGroupStanding(`GROUP_${letter}`, [
          createRow(1, { id: base + 1, name: `Líder ${letter}` }, { points: 9, gd: 3, gf: 4 }),
          createRow(2, { id: base + 2, name: `Vice ${letter}` }, { points: 6, gd: 1, gf: 3 }),
          createRow(3, { id: base + 3, name: `Terceiro ${letter}` }, { points: 3, gd: 0, gf: 2 }),
          createRow(4, { id: base + 4, name: `Último ${letter}` }, { points: 0, gd: -4, gf: 0 }),
        ]),
      ]
    })

    const bracket = buildKnockoutBracket(standings, [])

    expect(R32_TEMPLATE).toHaveLength(16)
    expect(bracket.rounds[0]?.stage).toBe('LAST_32')
    expect(bracket.rounds[0]?.matches).toHaveLength(16)
    expect(bracket.rounds[0]?.matches[0]?.home.label).toBe('2º Grupo A')
  })

  it('includes later rounds projected from winners', () => {
    const standings = [
      createGroupStanding('GROUP_A', [
        createRow(1, { id: 1, name: 'Brasil' }, { points: 9, gd: 4, gf: 5 }),
        createRow(2, { id: 2, name: 'Croácia' }, { points: 4, gd: 0, gf: 3 }),
        createRow(3, { id: 3, name: 'Marrocos' }, { points: 4, gd: 1, gf: 3 }),
        createRow(4, { id: 4, name: 'Canadá' }, { points: 3, gd: -1, gf: 2 }),
      ]),
    ]

    const bracket = buildKnockoutBracket(standings, [])

    expect(bracket.rounds.some((round) => round.stage === 'LAST_16')).toBe(true)
    expect(bracket.rounds.some((round) => round.stage === 'FINAL')).toBe(true)
  })
})
