import { describe, expect, it } from 'vitest'
import type { KnockoutBracket, KnockoutMatch } from '../models/knockout'
import type { Team } from '../models/team'
import { applySimulatorPicks, applySimulatorPick, getDescendantMatchKeys, isMatchPickable, pruneDownstreamPicks, resolveSimulatedWinner } from './knockoutSimulator'

function createTeam(id: number, name: string): Team {
  return {
    id,
    name,
    shortName: name,
    tla: name.slice(0, 3).toUpperCase(),
    crest: '',
    isDefined: true,
  }
}

function createFinishedMatch(
  key: string,
  stage: KnockoutMatch['stage'],
  home: Team,
  away: Team,
  homeGoals: number,
  awayGoals: number,
): KnockoutMatch {
  return {
    key,
    stage,
    home: { team: home, label: home.shortName, isProjected: false },
    away: { team: away, label: away.shortName, isProjected: false },
    score: { home: homeGoals, away: awayGoals },
    status: 'finished',
    utcDate: null,
    isProjected: false,
  }
}

function createBracket(): KnockoutBracket {
  const r32 = Array.from({ length: 16 }, (_, index) => ({
    key: `r32-${String(index + 1).padStart(2, '0')}`,
    stage: 'LAST_32' as const,
    home: { team: null, label: `H${index}`, isProjected: true },
    away: { team: null, label: `A${index}`, isProjected: true },
    score: { home: null, away: null },
    status: 'scheduled' as const,
    utcDate: null,
    isProjected: true,
  }))

  const r16 = Array.from({ length: 8 }, (_, index) => ({
    key: `last_16-${String(index + 1).padStart(2, '0')}`,
    stage: 'LAST_16' as const,
    home: { team: null, label: `H${index}`, isProjected: true },
    away: { team: null, label: `A${index}`, isProjected: true },
    score: { home: null, away: null },
    status: 'scheduled' as const,
    utcDate: null,
    isProjected: true,
  }))

  const qf = Array.from({ length: 4 }, (_, index) => ({
    key: `quarter_finals-${String(index + 1).padStart(2, '0')}`,
    stage: 'QUARTER_FINALS' as const,
    home: { team: null, label: `H${index}`, isProjected: true },
    away: { team: null, label: `A${index}`, isProjected: true },
    score: { home: null, away: null },
    status: 'scheduled' as const,
    utcDate: null,
    isProjected: true,
  }))

  const sf = Array.from({ length: 2 }, (_, index) => ({
    key: `semi_finals-${String(index + 1).padStart(2, '0')}`,
    stage: 'SEMI_FINALS' as const,
    home: { team: null, label: `H${index}`, isProjected: true },
    away: { team: null, label: `A${index}`, isProjected: true },
    score: { home: null, away: null },
    status: 'scheduled' as const,
    utcDate: null,
    isProjected: true,
  }))

  return {
    rounds: [
      { stage: 'LAST_32', label: '16 avos', matches: r32 },
      { stage: 'LAST_16', label: 'Oitavas', matches: r16 },
      { stage: 'QUARTER_FINALS', label: 'Quartas', matches: qf },
      { stage: 'SEMI_FINALS', label: 'Semifinais', matches: sf },
      {
        stage: 'FINAL',
        label: 'Final',
        matches: [
          {
            key: 'final-01',
            stage: 'FINAL',
            home: { team: null, label: 'H', isProjected: true },
            away: { team: null, label: 'A', isProjected: true },
            score: { home: null, away: null },
            status: 'scheduled',
            utcDate: null,
            isProjected: true,
          },
        ],
      },
      {
        stage: 'THIRD_PLACE',
        label: '3º lugar',
        matches: [
          {
            key: 'third_place-01',
            stage: 'THIRD_PLACE',
            home: { team: null, label: 'H', isProjected: true },
            away: { team: null, label: 'A', isProjected: true },
            score: { home: null, away: null },
            status: 'scheduled',
            utcDate: null,
            isProjected: true,
          },
        ],
      },
    ],
  }
}

describe('knockoutSimulator', () => {
  it('allows changing a simulated pick after it was set', () => {
    const brasil = createTeam(1, 'Brasil')
    const argentina = createTeam(2, 'Argentina')

    const match = createFinishedMatch('r32-01', 'LAST_32', brasil, argentina, 1, 0)

    expect(isMatchPickable(match, {})).toBe(false)
    expect(isMatchPickable(match, { 'r32-01': 'home' })).toBe(true)
    expect(isMatchPickable(match, { 'r32-01': 'away' })).toBe(true)
  })

  it('prunes only descendants in the same branch when a pick changes', () => {
    const bracket = createBracket()

    const pruned = pruneDownstreamPicks(
      bracket,
      {
        'r32-01': 'home',
        'r32-09': 'away',
        'last_16-01': 'home',
        'last_16-05': 'home',
      },
      'r32-01',
    )

    expect(pruned).toEqual({
      'r32-01': 'home',
      'r32-09': 'away',
      'last_16-05': 'home',
    })
  })

  it('maps quarter-final branches to the correct semi-final descendants', () => {
    const bracket = createBracket()

    expect(getDescendantMatchKeys(bracket, 'quarter_finals-01')).toEqual([
      'semi_finals-01',
      'final-01',
      'third_place-01',
    ])

    expect(getDescendantMatchKeys(bracket, 'quarter_finals-02')).toEqual([
      'semi_finals-02',
      'final-01',
      'third_place-01',
    ])
  })

  it('does not set a fake 1x0 score when only the winner is picked', () => {
    const brasil = createTeam(1, 'Brasil')
    const argentina = createTeam(2, 'Argentina')

    const bracket: KnockoutBracket = {
      rounds: [
        {
          stage: 'LAST_32',
          label: '16 avos',
          matches: [
            {
              key: 'r32-01',
              stage: 'LAST_32',
              home: { team: brasil, label: 'Brasil', isProjected: false },
              away: { team: argentina, label: 'Argentina', isProjected: false },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
          ],
        },
      ],
    }

    const simulated = applySimulatorPicks(bracket, { 'r32-01': 'home' })
    const match = simulated.rounds[0]?.matches[0]

    expect(match?.score).toEqual({ home: null, away: null })
    expect(match?.status).toBe('scheduled')
    expect(resolveSimulatedWinner(match!, { 'r32-01': 'home' })?.team?.id).toBe(1)
  })

  it('shows user-provided score when filled in', () => {
    const brasil = createTeam(1, 'Brasil')
    const argentina = createTeam(2, 'Argentina')

    const bracket: KnockoutBracket = {
      rounds: [
        {
          stage: 'LAST_32',
          label: '16 avos',
          matches: [
            {
              key: 'r32-01',
              stage: 'LAST_32',
              home: { team: brasil, label: 'Brasil', isProjected: false },
              away: { team: argentina, label: 'Argentina', isProjected: false },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
          ],
        },
      ],
    }

    const simulated = applySimulatorPicks(bracket, { 'r32-01': 'home' }, { 'r32-01': { home: 3, away: 1 } })
    const match = simulated.rounds[0]?.matches[0]

    expect(match?.score).toEqual({ home: 3, away: 1 })
    expect(match?.status).toBe('finished')
  })

  it('fills third place with semi-final losers instead of winners', () => {
    const brasil = createTeam(1, 'Brasil')
    const argentina = createTeam(2, 'Argentina')
    const franca = createTeam(3, 'França')
    const alemanha = createTeam(4, 'Alemanha')

    const bracket: KnockoutBracket = {
      rounds: [
        {
          stage: 'SEMI_FINALS',
          label: 'Semifinais',
          matches: [
            createFinishedMatch('semi-01', 'SEMI_FINALS', brasil, argentina, 1, 0),
            createFinishedMatch('semi-02', 'SEMI_FINALS', franca, alemanha, 0, 1),
          ],
        },
        {
          stage: 'THIRD_PLACE',
          label: '3º lugar',
          matches: [
            {
              key: 'third-01',
              stage: 'THIRD_PLACE',
              home: { team: null, label: 'A definir', isProjected: true },
              away: { team: null, label: 'A definir', isProjected: true },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
          ],
        },
        {
          stage: 'FINAL',
          label: 'Final',
          matches: [
            {
              key: 'final-01',
              stage: 'FINAL',
              home: { team: null, label: 'A definir', isProjected: true },
              away: { team: null, label: 'A definir', isProjected: true },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
          ],
        },
      ],
    }

    const simulated = applySimulatorPicks(bracket, {})
    const thirdPlace = simulated.rounds.find((round) => round.stage === 'THIRD_PLACE')?.matches[0]
    const finalMatch = simulated.rounds.find((round) => round.stage === 'FINAL')?.matches[0]

    expect(thirdPlace?.home.team?.id).toBe(2)
    expect(thirdPlace?.away.team?.id).toBe(3)
    expect(finalMatch?.home.team?.id).toBe(1)
    expect(finalMatch?.away.team?.id).toBe(4)
  })

  it('does not prune downstream picks when the same winner is selected again', () => {
    const bracket = createBracket()
    const picks = {
      'quarter_finals-01': 'home',
      'semi_finals-01': 'home',
      'final-01': 'home',
    } as const

    const next = applySimulatorPick(bracket, picks, 'quarter_finals-01', 'home')

    expect(next).toBe(picks)
  })

  it('keeps the first semi-final winner when the second semi-final is picked', () => {
    const brasil = createTeam(1, 'Brasil')
    const franca = createTeam(3, 'França')
    const espanha = createTeam(5, 'Espanha')
    const argentina = createTeam(2, 'Argentina')

    const bracket: KnockoutBracket = {
      rounds: [
        {
          stage: 'SEMI_FINALS',
          label: 'Semifinais',
          matches: [
            {
              key: 'semi_finals-01',
              stage: 'SEMI_FINALS',
              home: { team: brasil, label: 'Brasil', isProjected: false },
              away: { team: franca, label: 'França', isProjected: false },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
            {
              key: 'semi_finals-02',
              stage: 'SEMI_FINALS',
              home: { team: espanha, label: 'Espanha', isProjected: false },
              away: { team: argentina, label: 'Argentina', isProjected: false },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
          ],
        },
        {
          stage: 'THIRD_PLACE',
          label: '3º lugar',
          matches: [
            {
              key: 'third_place-01',
              stage: 'THIRD_PLACE',
              home: { team: null, label: 'A definir', isProjected: true },
              away: { team: null, label: 'A definir', isProjected: true },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
          ],
        },
        {
          stage: 'FINAL',
          label: 'Final',
          matches: [
            {
              key: 'final-01',
              stage: 'FINAL',
              home: { team: null, label: 'A definir', isProjected: true },
              away: { team: null, label: 'A definir', isProjected: true },
              score: { home: null, away: null },
              status: 'scheduled',
              utcDate: null,
              isProjected: true,
            },
          ],
        },
      ],
    }

    const picks = pruneDownstreamPicks(
      bracket,
      {
        'semi_finals-01': 'home',
        'final-01': 'home',
        'semi_finals-02': 'home',
      },
      'semi_finals-02',
    )

    expect(picks['semi_finals-01']).toBe('home')
    expect(picks['final-01']).toBeUndefined()

    const simulated = applySimulatorPicks(bracket, picks)
    const finalMatch = simulated.rounds.find((round) => round.stage === 'FINAL')?.matches[0]

    expect(finalMatch?.home.team?.id).toBe(1)
    expect(finalMatch?.away.team?.id).toBe(5)
    expect(resolveSimulatedWinner(bracket.rounds[0]!.matches[0], picks)?.team?.id).toBe(1)
  })
})
