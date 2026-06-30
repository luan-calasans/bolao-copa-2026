/**
 * @typedef {{ home: number | null, away: number | null } | null | undefined} ApiScoreDetail
 * @typedef {{
 *   fullTime?: ApiScoreDetail
 *   regularTime?: ApiScoreDetail
 *   extraTime?: ApiScoreDetail
 *   penalties?: ApiScoreDetail
 * }} ApiScoreLike
 */

/**
 * @param {ApiScoreDetail} detail
 * @returns {{ home: number, away: number } | null}
 */
function mapScoreDetail(detail) {
  if (!detail || detail.home == null || detail.away == null) {
    return null
  }

  return { home: detail.home, away: detail.away }
}

/**
 * Football-Data may inflate `fullTime` with penalty goals. Prefer `regularTime` when present.
 *
 * @param {ApiScoreLike | null | undefined} apiScore
 * @returns {{ home: number | null, away: number | null }}
 */
export function resolveRegulationScoreFromApi(apiScore) {
  const regulation =
    mapScoreDetail(apiScore?.regularTime) ?? mapScoreDetail(apiScore?.fullTime)

  return regulation ?? { home: null, away: null }
}

/**
 * @param {ApiScoreLike | null | undefined} apiScore
 * @returns {{ home: number, away: number } | null}
 */
export function resolvePenaltyScoreFromApi(apiScore) {
  const penalties = mapScoreDetail(apiScore?.penalties)
  if (!penalties) return null

  const regulation = resolveRegulationScoreFromApi(apiScore)
  if (regulation.home == null || regulation.away == null || regulation.home !== regulation.away) {
    return null
  }

  return penalties
}
