import { describe, expect, it } from 'vitest'
import type { ApiStandingTable } from '../models/api.types'
import type { Team } from '../models/team'
import { buildKnockoutBracket } from './knockoutBracketBuilder'
import {
  buildGroupSnapshots,
  getQualifiedThirdGroups,
  isGroupStageComplete,
  rankThirdPlaceTeams,
} from './knockoutQualifiers'
import { GROUP_CODES, buildRoundOf32Fixtures } from './knockoutBracketTemplate'

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

  it('detects completed group stage when all 12 groups played 3 matches', () => {
    const standings = GROUP_CODES.map((code) =>
      createGroupStanding(`GROUP_${code}`, [
        createRow(1, { id: 1, name: 'Brasil' }, { points: 9, gd: 4, gf: 5, played: 3 }),
        createRow(2, { id: 2, name: 'Croácia' }, { points: 4, gd: 0, gf: 3, played: 3 }),
        createRow(3, { id: 3, name: 'Marrocos' }, { points: 4, gd: 1, gf: 3, played: 3 }),
        createRow(4, { id: 4, name: 'Canadá' }, { points: 3, gd: -1, gf: 2, played: 3 }),
      ]),
    )

    expect(isGroupStageComplete(standings)).toBe(true)
  })

  it('treats partial group data as incomplete', () => {
    const standings = [
      createGroupStanding('GROUP_A', [
        createRow(1, { id: 1, name: 'Brasil' }, { points: 9, gd: 4, gf: 5, played: 3 }),
        createRow(2, { id: 2, name: 'Croácia' }, { points: 4, gd: 0, gf: 3, played: 3 }),
        createRow(3, { id: 3, name: 'Marrocos' }, { points: 4, gd: 1, gf: 3, played: 3 }),
        createRow(4, { id: 4, name: 'Canadá' }, { points: 3, gd: -1, gf: 2, played: 3 }),
      ]),
    ]

    expect(isGroupStageComplete(standings)).toBe(false)
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

    expect(buildRoundOf32Fixtures()).toHaveLength(16)
    expect(bracket.rounds[0]?.stage).toBe('LAST_32')
    expect(bracket.rounds[0]?.matches).toHaveLength(16)
    expect(bracket.rounds[0]?.matches[0]?.matchId).toBe('M74')
    expect(bracket.rounds[0]?.matches[0]?.home.label).toBe('1E')
  })

  it('keeps official bracket order when merging API round-of-32 matches', () => {
    const team = (id: number, name: string): Team => ({
      id,
      name,
      shortName: name,
      tla: name.slice(0, 3).toUpperCase(),
      crest: '',
      isDefined: true,
    })

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

    const apiMatches = Array.from({ length: 16 }, (_, index) => ({
      id: 5000 + index,
      utcDate: `2026-07-${String(index + 1).padStart(2, '0')}T20:00:00Z`,
      status: 'scheduled' as const,
      rawStatus: 'SCHEDULED',
      minute: null,
      venue: null,
      matchday: 73 + index,
      stage: 'LAST_32',
      group: null,
      homeTeam: team(9000 + index * 2, `API Casa ${index}`),
      awayTeam: team(9001 + index * 2, `API Fora ${index}`),
      score: { home: null, away: null },
      halfTimeScore: { home: null, away: null },
      isLive: false,
    }))

    const bracket = buildKnockoutBracket(standings, apiMatches)
    const r32 = bracket.rounds[0]?.matches ?? []

    expect(r32[0]?.matchId).toBe('M74')
    expect(r32[0]?.id).toBe(5001)
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

  it('advances penalty shootout winners into the next round', () => {
    const team = (id: number, name: string): Team => ({
      id,
      name,
      shortName: name,
      tla: name.slice(0, 3).toUpperCase(),
      crest: '',
      isDefined: true,
    })

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

    const winner = team(100, 'Vencedor')
    const loser = team(101, 'Perdedor')

    const apiMatches = [
      {
        id: 6001,
        utcDate: '2026-07-01T20:00:00Z',
        status: 'finished' as const,
        rawStatus: 'FINISHED',
        minute: null,
        venue: null,
        matchday: 74,
        stage: 'LAST_32',
        group: null,
        homeTeam: winner,
        awayTeam: loser,
        score: { home: 1, away: 1 },
        halfTimeScore: { home: 0, away: 1 },
        penalties: { home: 4, away: 3 },
        isLive: false,
      },
      {
        id: 6101,
        utcDate: '2026-07-05T20:00:00Z',
        status: 'scheduled' as const,
        rawStatus: 'SCHEDULED',
        minute: null,
        venue: null,
        matchday: 90,
        stage: 'LAST_16',
        group: null,
        homeTeam: { ...team(9000, 'A definir'), isDefined: false },
        awayTeam: { ...team(9001, 'A definir'), isDefined: false },
        score: { home: null, away: null },
        halfTimeScore: { home: null, away: null },
        isLive: false,
      },
    ]

    const bracket = buildKnockoutBracket(standings, apiMatches)
    const r16 = bracket.rounds.find((round) => round.stage === 'LAST_16')?.matches ?? []

    expect(r16.some((match) => match.home.team?.id === winner.id || match.away.team?.id === winner.id)).toBe(
      true,
    )
  })

  it('advances extra-time winners into the next round', () => {
    const team = (id: number, name: string): Team => ({
      id,
      name,
      shortName: name,
      tla: name.slice(0, 3).toUpperCase(),
      crest: '',
      isDefined: true,
    })

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

    const winner = team(200, 'Vencedor Prorrogação')
    const loser = team(201, 'Perdedor Prorrogação')

    const apiMatches = [
      {
        id: 7001,
        utcDate: '2026-07-02T20:00:00Z',
        status: 'finished' as const,
        rawStatus: 'FINISHED',
        minute: null,
        venue: null,
        matchday: 75,
        stage: 'LAST_32',
        group: null,
        homeTeam: winner,
        awayTeam: loser,
        score: { home: 1, away: 1 },
        halfTimeScore: { home: 1, away: 0 },
        extraTime: { home: 1, away: 0 },
        isLive: false,
      },
    ]

    const bracket = buildKnockoutBracket(standings, apiMatches)
    const r16 = bracket.rounds.find((round) => round.stage === 'LAST_16')?.matches ?? []

    expect(r16.some((match) => match.home.team?.id === winner.id || match.away.team?.id === winner.id)).toBe(
      true,
    )
  })
})
