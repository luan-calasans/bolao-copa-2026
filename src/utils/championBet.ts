import { getChampionBetDeadlineMs } from '../../shared/championBetAcceptance.js'
import { CHAMPION_BET_POINTS } from '../../shared/championBetConstants.js'
import { findWorldCupFinalMatch } from '../../shared/finalMatch.js'
import type { Match } from '../models/match'

export { CHAMPION_BET_POINTS }
export { getChampionBetBlockReason, canAcceptChampionBet } from '../../shared/championBetAcceptance.js'
export { findWorldCupFinalMatch } from '../../shared/finalMatch.js'

export function findFinalMatchFromMatches(matches: Match[]) {
  return findWorldCupFinalMatch(matches)
}

export function getChampionBetDeadlineFromFinal(finalMatch: Match | null): string | null {
  if (!finalMatch) return null

  const deadlineMs = getChampionBetDeadlineMs({
    utcDate: finalMatch.utcDate,
  })

  return deadlineMs != null ? new Date(deadlineMs).toISOString() : null
}

export function formatChampionDeadline(value: string | null): string | null {
  if (!value) return null

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return null
  }
}
