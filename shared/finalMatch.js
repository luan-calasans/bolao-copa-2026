/**
 * @param {Array<{ stage?: string, utcDate?: string }>} matches
 */
export function findWorldCupFinalMatch(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return null
  }

  const finals = matches.filter((match) => match.stage === 'FINAL')

  if (finals.length === 0) {
    return null
  }

  return [...finals].sort(
    (a, b) => Date.parse(a.utcDate ?? '') - Date.parse(b.utcDate ?? ''),
  )[0]
}

/**
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
 * @returns {number | null}
 */
export function getChampionTeamIdFromFinal(finalMatch) {
  if (!finalMatch || finalMatch.status !== 'finished') {
    return null
  }

  const winner = finalMatch.score?.winner

  if (winner === 'HOME_TEAM') {
    return finalMatch.homeTeam?.id ?? null
  }

  if (winner === 'AWAY_TEAM') {
    return finalMatch.awayTeam?.id ?? null
  }

  const home = finalMatch.score?.home
  const away = finalMatch.score?.away

  if (home == null || away == null) {
    return null
  }

  if (home > away) {
    return finalMatch.homeTeam?.id ?? null
  }

  if (away > home) {
    return finalMatch.awayTeam?.id ?? null
  }

  return null
}
