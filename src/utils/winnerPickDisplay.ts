import type { Match } from '../models/match'
import type { WinnerPick } from '../models/winnerPick'
import { getTeamDisplayName } from './teamDisplay'

export function formatWinnerPickLabel(match: Match, winnerPick: WinnerPick): string {
  switch (winnerPick) {
    case 'home':
      return getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)
    case 'away':
      return getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)
    case 'draw':
      return 'Empate'
  }
}

export function getWinnerPickTextClass(winnerPick: WinnerPick): string {
  return winnerPick === 'draw' ? 'text-amber-400' : 'text-emerald-400'
}
