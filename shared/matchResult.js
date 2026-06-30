/**
 * @typedef {'home' | 'away' | 'draw'} MatchSide
 * @typedef {{
 *   score: { home: number | null, away: number | null }
 *   penalties?: { home: number | null, away: number | null } | null
 *   extraTime?: { home: number | null, away: number | null } | null
 *   winner?: MatchSide | 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
 * }} MatchResultLike
 */

function getMatchOutcome(home, away) {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

/**
 * @param {MatchResultLike['winner']} winner
 * @returns {MatchSide | null}
 */
export function normalizeMatchWinner(winner) {
  if (winner === 'home' || winner === 'HOME_TEAM') return 'home'
  if (winner === 'away' || winner === 'AWAY_TEAM') return 'away'
  if (winner === 'draw' || winner === 'DRAW') return 'draw'
  return null
}

/**
 * Total score after extra time when regulation ended in a draw.
 *
 * @param {MatchResultLike} match
 * @returns {{ home: number, away: number } | null}
 */
export function getExtraTimeFullScore(match) {
  const { home, away } = match.score
  const etHome = match.extraTime?.home
  const etAway = match.extraTime?.away

  if (home == null || away == null || etHome == null || etAway == null) {
    return null
  }

  if (home !== away) {
    return null
  }

  return { home: home + etHome, away: away + etAway }
}

/**
 * @param {MatchResultLike} match
 * @returns {MatchSide | null}
 */
export function resolveMatchWinner(match) {
  const { home, away } = match.score

  if (home == null || away == null) {
    return null
  }

  if (home !== away) {
    return home > away ? 'home' : 'away'
  }

  const extraTimeTotal = getExtraTimeFullScore(match)
  if (extraTimeTotal) {
    const extraTimeOutcome = getMatchOutcome(extraTimeTotal.home, extraTimeTotal.away)
    if (extraTimeOutcome !== 'draw') {
      return extraTimeOutcome
    }
  }

  const penHome = match.penalties?.home
  const penAway = match.penalties?.away

  if (penHome != null && penAway != null && penHome !== penAway) {
    return penHome > penAway ? 'home' : 'away'
  }

  const apiWinner = normalizeMatchWinner(match.winner ?? null)
  if (apiWinner === 'home' || apiWinner === 'away') {
    return apiWinner
  }

  return 'draw'
}
