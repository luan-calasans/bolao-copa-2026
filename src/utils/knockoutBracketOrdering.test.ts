import { describe, expect, it } from 'vitest'
import { getMatchWinner } from '../components/knockout/knockoutBracketLayout'
import type { HistoricalWorldCupJson } from '../models/historicalWorldCup'
import { buildHistoricalKnockoutBracket } from './historicalKnockoutMapper'
import { orderKnockoutRounds } from './knockoutBracketOrdering'
import worldCup2018Data from '../../public/data/2018/worldcup.json'

const worldCup2018 = worldCup2018Data as HistoricalWorldCupJson

function winnerName(
  match: ReturnType<typeof buildHistoricalKnockoutBracket>['rounds'][number]['matches'][number],
) {
  return getMatchWinner(match)?.team?.name ?? null
}

describe('knockoutBracketOrdering', () => {
  it('orders 2018 quarter-finals by bracket flow instead of kickoff date', () => {
    const bracket = buildHistoricalKnockoutBracket(worldCup2018.matches)
    const quarterFinals = bracket.rounds.find((round) => round.stage === 'QUARTER_FINALS')

    expect(quarterFinals?.matches.map(winnerName)).toEqual(['França', 'Croácia', 'Bélgica', 'Inglaterra'])

    const leftQuarterFinals = quarterFinals?.matches.slice(0, 2) ?? []
    expect(leftQuarterFinals.flatMap((match) => [match.home.team?.name, match.away.team?.name]).sort()).toEqual(
      ['Croácia', 'França', 'Rússia', 'Uruguai'].sort(),
    )
  })

  it('keeps 2018 semi-finals aligned with cross-bracket pairings', () => {
    const bracket = buildHistoricalKnockoutBracket(worldCup2018.matches)
    const semiFinals = bracket.rounds.find((round) => round.stage === 'SEMI_FINALS')

    expect(semiFinals?.matches.map((match) => `${match.home.team?.name}-${match.away.team?.name}`)).toEqual([
      'França-Bélgica',
      'Croácia-Inglaterra',
    ])
    expect(semiFinals?.matches.map(winnerName)).toEqual(['França', 'Croácia'])
  })

  it('returns original order when winners are not known yet', () => {
    const rounds = [
      {
        stage: 'LAST_16' as const,
        label: 'Oitavas',
        matches: [
          {
            key: 'r16-1',
            stage: 'LAST_16' as const,
            home: { team: null, label: 'A', isProjected: true },
            away: { team: null, label: 'B', isProjected: true },
            score: { home: null, away: null },
            status: 'scheduled' as const,
            utcDate: null,
            isProjected: true,
          },
        ],
      },
      {
        stage: 'QUARTER_FINALS' as const,
        label: 'Quartas',
        matches: [
          {
            key: 'qf-2',
            stage: 'QUARTER_FINALS' as const,
            home: { team: null, label: 'C', isProjected: true },
            away: { team: null, label: 'D', isProjected: true },
            score: { home: null, away: null },
            status: 'scheduled' as const,
            utcDate: null,
            isProjected: true,
          },
          {
            key: 'qf-1',
            stage: 'QUARTER_FINALS' as const,
            home: { team: null, label: 'E', isProjected: true },
            away: { team: null, label: 'F', isProjected: true },
            score: { home: null, away: null },
            status: 'scheduled' as const,
            utcDate: null,
            isProjected: true,
          },
        ],
      },
    ]

    expect(orderKnockoutRounds(rounds)[1]?.matches.map((match) => match.key)).toEqual(['qf-2', 'qf-1'])
  })
})
