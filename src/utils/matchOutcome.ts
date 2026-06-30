import type { Match } from '../models/match'

export type TeamOutcome = 'win' | 'loss' | 'draw'

export function shouldShowMatchOutcome(
  status: string,
  home: number | null,
  away: number | null,
): boolean {
  if (home === null || away === null) return false
  return status === 'finished'
}

export function getTeamOutcome(home: number, away: number, side: 'home' | 'away'): TeamOutcome {
  if (home === away) return 'draw'

  if (side === 'home') {
    return home > away ? 'win' : 'loss'
  }

  return away > home ? 'win' : 'loss'
}

function resolveWinnerFromPenalties(match: Match): 'home' | 'away' | null {
  const penHome = match.penalties?.home
  const penAway = match.penalties?.away

  if (penHome == null || penAway == null || penHome === penAway) {
    return null
  }

  return penHome > penAway ? 'home' : 'away'
}

function resolveWinnerFromExtraTime(match: Match): 'home' | 'away' | null {
  const { home, away } = match.score
  const etHome = match.extraTime?.home
  const etAway = match.extraTime?.away

  if (home == null || away == null || etHome == null || etAway == null) {
    return null
  }

  const totalHome = home + etHome
  const totalAway = away + etAway

  if (totalHome === totalAway) {
    return null
  }

  return totalHome > totalAway ? 'home' : 'away'
}

export function getTeamMatchOutcome(match: Match, side: 'home' | 'away'): TeamOutcome {
  const { home, away } = match.score

  if (home == null || away == null) {
    return 'draw'
  }

  if (home !== away) {
    return getTeamOutcome(home, away, side)
  }

  if (match.winner && match.winner !== 'draw') {
    return match.winner === side ? 'win' : 'loss'
  }

  const penaltyWinner = resolveWinnerFromPenalties(match)
  if (penaltyWinner) {
    return penaltyWinner === side ? 'win' : 'loss'
  }

  const extraTimeWinner = resolveWinnerFromExtraTime(match)
  if (extraTimeWinner) {
    return extraTimeWinner === side ? 'win' : 'loss'
  }

  return 'draw'
}

export function getTeamOutcomeClasses(outcome: TeamOutcome): string {
  const classes: Record<TeamOutcome, string> = {
    win: 'rounded-xl border-2 border-brazil-green/70 bg-brazil-green/10 p-1.5 shadow-sm shadow-brazil-green/10',
    loss: 'rounded-xl border-2 border-red-500/70 bg-red-500/10 p-1.5 shadow-sm shadow-red-500/10',
    draw: 'rounded-xl border-2 border-amber-400/60 bg-amber-400/10 p-1.5 shadow-sm shadow-amber-400/10',
  }

  return classes[outcome]
}
