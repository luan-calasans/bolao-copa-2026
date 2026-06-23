import { CHAMPION_BET_POINTS } from './championBetConstants.js'
import { getChampionTeamIdFromFinal } from './finalMatch.js'

/**
 * @param {number} pickedTeamId
 * @param {{
 *   status?: string,
 *   homeTeam?: { id?: number | null },
 *   awayTeam?: { id?: number | null },
 *   score?: {
 *     winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null,
 *     home?: number | null,
 *     away?: number | null,
 *   },
 * } | null} finalMatch
 */
export function getChampionBetScore(pickedTeamId, finalMatch) {
  if (!finalMatch || finalMatch.status !== 'finished') {
    return {
      points: 0,
      scoreType: 'pending',
    }
  }

  const championTeamId = getChampionTeamIdFromFinal(finalMatch)

  if (championTeamId == null) {
    return {
      points: 0,
      scoreType: 'pending',
    }
  }

  if (pickedTeamId === championTeamId) {
    return {
      points: CHAMPION_BET_POINTS,
      scoreType: 'exact',
    }
  }

  return {
    points: 0,
    scoreType: 'none',
  }
}
