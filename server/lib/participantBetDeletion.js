import { findWorldCupFinalMatch } from '../../shared/finalMatch.js'
import {
  canParticipantDeleteByMatchStatus,
  PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE,
  PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE,
} from '../../shared/participantBetDeletion.js'
import { fetchMatchById, fetchWorldCupMatchesForChampion } from './footballApi.js'

let fetchMatchByIdOverride = null
let fetchWorldCupMatchesForChampionOverride = null

export function setParticipantBetDeletionOverrides(overrides = {}) {
  fetchMatchByIdOverride = overrides.fetchMatchById ?? null
  fetchWorldCupMatchesForChampionOverride = overrides.fetchWorldCupMatchesForChampion ?? null
}

export function resetParticipantBetDeletionOverrides() {
  fetchMatchByIdOverride = null
  fetchWorldCupMatchesForChampionOverride = null
}

/**
 * @param {{
 *   matchId?: number | null
 *   matchSnapshot?: { status?: string } | null
 *   isChampion?: boolean
 * } | null} record
 * @returns {Promise<string | null>}
 */
export async function getParticipantOwnedBetDeletionBlockReason(record) {
  if (!record) {
    return null
  }

  if (record.isChampion) {
    const fetchMatches = fetchWorldCupMatchesForChampionOverride ?? fetchWorldCupMatchesForChampion
    const matches = await fetchMatches()
    const finalMatch = findWorldCupFinalMatch(matches)

    if (finalMatch && !canParticipantDeleteByMatchStatus(finalMatch.status)) {
      return PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE
    }

    return null
  }

  if (!record.matchId) {
    return null
  }

  const fetchMatch = fetchMatchByIdOverride ?? fetchMatchById
  const apiMatch = await fetchMatch(record.matchId)
  const status = apiMatch?.status ?? record.matchSnapshot?.status ?? null

  if (status && !canParticipantDeleteByMatchStatus(status)) {
    return PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE
  }

  return null
}
