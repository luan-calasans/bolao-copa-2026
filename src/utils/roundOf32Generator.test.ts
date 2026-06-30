import { describe, expect, it } from 'vitest'
import type { ApiStandingTable } from '../models/api.types'
import { thirdPlacedMapping } from '../data/thirdPlacedMapping'
import {
  generateRoundOf32,
  getBestThirdPlacedTeams,
  getGroupPositions,
  getThirdPlacedCombination,
} from './roundOf32Generator'

function createRow(
  position: number,
  team: { id: number; name: string },
  stats: { points: number; gd: number; gf: number; played?: number },
) {
  return {
    position,
    team: {
      id: team.id,
      name: team.name,
      shortName: team.name,
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

function createFullStandings(): ApiStandingTable[] {
  const letters = 'ABCDEFGHIJKL'.split('')
  return letters.map((letter, groupIndex) => {
    const base = groupIndex * 4
    return createGroupStanding(`GROUP_${letter}`, [
      createRow(1, { id: base + 1, name: `Líder ${letter}` }, { points: 9, gd: 3, gf: 4 }),
      createRow(2, { id: base + 2, name: `Vice ${letter}` }, { points: 6, gd: 1, gf: 3 }),
      createRow(3, { id: base + 3, name: `Terceiro ${letter}` }, { points: 3, gd: 0, gf: 2 }),
      createRow(4, { id: base + 4, name: `Último ${letter}` }, { points: 0, gd: -4, gf: 0 }),
    ])
  })
}

describe('thirdPlacedMapping', () => {
  it('contains all 495 official combinations', () => {
    expect(Object.keys(thirdPlacedMapping)).toHaveLength(495)
  })

  it('maps combination CDEFGIKL using Annex C row 37', () => {
    const mapping = thirdPlacedMapping.CDEFGIKL

    expect(mapping).toEqual({
      '1A': '3C',
      '1B': '3G',
      '1D': '3E',
      '1E': '3D',
      '1G': '3I',
      '1I': '3F',
      '1K': '3L',
      '1L': '3K',
    })
  })
})

describe('roundOf32Generator', () => {
  it('exposes group positions by code', () => {
    const standings = createFullStandings()
    const positions = getGroupPositions(standings)

    expect(positions['1A']?.team?.name).toBe('Líder A')
    expect(positions['2B']?.team?.name).toBe('Vice B')
    expect(positions['3C']?.team?.name).toBe('Terceiro C')
  })

  it('ranks and selects the 8 best third-placed teams', () => {
    const standings = createFullStandings()
    const bestThirds = getBestThirdPlacedTeams(standings)
    const combination = getThirdPlacedCombination(bestThirds)

    expect(bestThirds).toHaveLength(12)
    expect(bestThirds.filter((entry) => entry.isQualified)).toHaveLength(8)
    expect(combination).toHaveLength(8)
  })

  it('builds fixed round-of-32 fixtures without greedy assignment', () => {
    const standings = createFullStandings()
    const matches = generateRoundOf32(standings)

    expect(matches).toHaveLength(16)
    expect(matches[0]).toMatchObject({
      matchId: 'M74',
      homeCode: '1E',
    })

    const m73 = matches.find((match) => match.matchId === 'M73')
    expect(m73).toMatchObject({
      homeCode: '2A',
      awayCode: '2B',
    })

    const m74 = matches.find((match) => match.matchId === 'M74')
    const combination = getThirdPlacedCombination(getBestThirdPlacedTeams(standings))
    const mapping = thirdPlacedMapping[[...combination].sort().join('')]

    expect(m74?.homeCode).toBe('1E')
    expect(m74?.awayCode).toBe(mapping['1E'])
  })

  it('shows placeholders when group stage is incomplete', () => {
    const standings = [
      createGroupStanding('GROUP_A', [
        createRow(1, { id: 1, name: 'Brasil' }, { points: 6, gd: 2, gf: 3, played: 2 }),
        createRow(2, { id: 2, name: 'Croácia' }, { points: 4, gd: 0, gf: 2, played: 2 }),
        createRow(3, { id: 3, name: 'Marrocos' }, { points: 3, gd: 0, gf: 1, played: 2 }),
        createRow(4, { id: 4, name: 'Canadá' }, { points: 1, gd: -2, gf: 0, played: 2 }),
      ]),
    ]

    const matches = generateRoundOf32(standings)

    expect(matches[0]?.homeLabel).toBe('1E')
    expect(matches[0]?.homeTeam).toBeNull()

    const m74 = matches.find((match) => match.matchId === 'M74')
    expect(m74?.awayLabel).toContain('3º')
    expect(m74?.awayTeam).toBeNull()
  })
})
