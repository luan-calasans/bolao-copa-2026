import type { Match } from '../models/match'
import type { Team } from '../models/team'
import { getBetScore, type BetScoreType } from './betScoring'

export type BetResultStatus = BetScoreType

export type BetOutcome = { type: 'draw' } | { type: 'win'; team: Team }

export function getBetResultStatus(
  match: Pick<Match, 'status' | 'score'>,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  winnerPick?: import('../models/winnerPick').WinnerPick | null,
): BetResultStatus {
  if (homeScore == null || awayScore == null) {
    if (match.status !== 'finished') {
      return 'pending'
    }

    const result = getBetScore(match, homeScore, awayScore, winnerPick)
    return result.winnerPoints > 0 ? 'partial' : 'none'
  }

  return getBetScore(match, homeScore, awayScore, winnerPick).scoreType
}

export function formatBetResultLabel(status: BetResultStatus): string {
  const labels: Record<BetResultStatus, string> = {
    exact: 'Placar exato',
    partial: 'Parcial',
    none: 'Errou',
    pending: 'Aguardando',
  }

  return labels[status]
}

export function formatBetResultPoints(status: BetResultStatus, points: number | null): string {
  if (status === 'pending' || points === null) {
    return formatBetResultLabel('pending')
  }

  return `${points} pts`
}

export function getBetOutcome(match: Match, homeScore: number, awayScore: number): BetOutcome {
  if (homeScore > awayScore) {
    return { type: 'win', team: match.homeTeam }
  }

  if (awayScore > homeScore) {
    return { type: 'win', team: match.awayTeam }
  }

  return { type: 'draw' }
}
