import type { KnockoutMatch, KnockoutRound, KnockoutStage } from '../models/knockout'
import { getMatchWinner } from '../components/knockout/knockoutBracketLayout'
import { canonicalizeTeamName } from './historicalTeamNames'

function getWinnerName(match: KnockoutMatch): string | null {
  const winner = getMatchWinner(match)
  if (!winner) return null
  return winner.team?.name ?? winner.label
}

function findMatchBetweenTeams(
  matches: KnockoutMatch[],
  teamA: string,
  teamB: string,
): KnockoutMatch | undefined {
  const left = canonicalizeTeamName(teamA)
  const right = canonicalizeTeamName(teamB)

  return matches.find((match) => {
    const home = canonicalizeTeamName(match.home.team?.name ?? match.home.label)
    const away = canonicalizeTeamName(match.away.team?.name ?? match.away.label)
    return (home === left && away === right) || (home === right && away === left)
  })
}

function getWinnerPairings(stage: KnockoutStage, winnerCount: number): Array<[number, number]> {
  if (stage === 'SEMI_FINALS' && winnerCount === 4) {
    return [
      [0, 2],
      [1, 3],
    ]
  }

  const pairs: Array<[number, number]> = []
  for (let index = 0; index < winnerCount; index += 2) {
    pairs.push([index, index + 1])
  }

  return pairs
}

function getBracketPreviousRound(rounds: KnockoutRound[], roundIndex: number): KnockoutRound | undefined {
  const stage = rounds[roundIndex]?.stage
  if (!stage) return undefined

  if (stage === 'FINAL') {
    return rounds.find((round) => round.stage === 'SEMI_FINALS' && round.matches.length > 0)
  }

  for (let index = roundIndex - 1; index >= 0; index -= 1) {
    const candidate = rounds[index]
    if (candidate.stage === 'THIRD_PLACE') continue
    return candidate
  }

  return undefined
}

export function orderKnockoutRoundMatches(
  previousRoundMatches: KnockoutMatch[],
  currentRoundMatches: KnockoutMatch[],
  stage: KnockoutStage,
): KnockoutMatch[] {
  if (currentRoundMatches.length <= 1) return currentRoundMatches

  const winners = previousRoundMatches.map(getWinnerName)
  if (winners.some((winner) => winner == null)) {
    return currentRoundMatches
  }

  const pairings = getWinnerPairings(stage, winners.length)
  const ordered = pairings
    .map(([leftIndex, rightIndex]) =>
      findMatchBetweenTeams(currentRoundMatches, winners[leftIndex]!, winners[rightIndex]!),
    )
    .filter((match): match is KnockoutMatch => match != null)

  return ordered.length === currentRoundMatches.length ? ordered : currentRoundMatches
}

export function orderKnockoutRounds(rounds: KnockoutRound[]): KnockoutRound[] {
  if (rounds.length <= 1) return rounds

  return rounds.map((round, roundIndex) => {
    if (round.stage === 'THIRD_PLACE' || round.matches.length <= 1) {
      return round
    }

    const previousRound = getBracketPreviousRound(rounds, roundIndex)
    if (!previousRound) return round

    return {
      ...round,
      matches: orderKnockoutRoundMatches(previousRound.matches, round.matches, round.stage),
    }
  })
}
