import { describe, expect, it } from 'vitest'
import type { ApiStandingTable } from '../models/api.types'
import { buildThirdPlaceRanking } from './thirdPlaceRanking'

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

describe('buildThirdPlaceRanking', () => {
  it('ranks third-place teams and marks top 8 as qualified', () => {
    const standings = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(
      (letter, index) =>
        createGroupStanding(`GROUP_${letter}`, [
          createRow(1, { id: index * 10 + 1, name: `Líder ${letter}` }, { points: 9, gd: 3, gf: 4 }),
          createRow(2, { id: index * 10 + 2, name: `Vice ${letter}` }, { points: 6, gd: 1, gf: 3 }),
          createRow(
            3,
            { id: index * 10 + 3, name: `Terceiro ${letter}` },
            { points: 12 - index, gd: index, gf: 5 - index },
          ),
          createRow(4, { id: index * 10 + 4, name: `Último ${letter}` }, { points: 0, gd: -4, gf: 0 }),
        ]),
    )

    const ranking = buildThirdPlaceRanking(standings)

    expect(ranking).toHaveLength(12)
    expect(ranking[0]?.rank).toBe(1)
    expect(ranking[0]?.isQualified).toBe(true)
    expect(ranking[7]?.rank).toBe(8)
    expect(ranking[7]?.isQualified).toBe(true)
    expect(ranking[8]?.rank).toBe(9)
    expect(ranking[8]?.isQualified).toBe(false)
    expect(ranking.every((entry) => entry.group.length === 1)).toBe(true)
  })
})
