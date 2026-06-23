import { getBetScore } from './betScoring.js'

export function buildPendingScore(matchId) {
  return {
    points: 0,
    scoreType: 'pending',
    winnerPoints: 0,
    homeTeamPoints: 0,
    awayTeamPoints: 0,
    actualHomeScore: null,
    actualAwayScore: null,
    matchId,
  }
}

export function computeBetScore(match, bet) {
  if (!match) {
    return buildPendingScore(bet.match_id)
  }

  return getBetScore(match, bet.home_score, bet.away_score, bet.winner_pick ?? null)
}

export function needsBetScoreSync(existing, computed) {
  if (!existing?.score_type) {
    return true
  }

  if (existing.score_type === 'pending' && computed.scoreType !== 'pending') {
    return true
  }

  if (computed.scoreType === 'pending') {
    return existing.score_type !== 'pending'
  }

  return (
    existing.score_type !== computed.scoreType ||
    existing.points !== computed.points ||
    existing.winner_points !== computed.winnerPoints ||
    existing.home_team_points !== computed.homeTeamPoints ||
    existing.away_team_points !== computed.awayTeamPoints ||
    existing.actual_home_score !== computed.actualHomeScore ||
    existing.actual_away_score !== computed.actualAwayScore
  )
}

/** Includes pending bets and finalized scores that may need resync after API corrections. */
export function isBetScoreSyncCandidate(row) {
  if (!row.score_type || row.score_type === 'pending') {
    return true
  }

  return row.score_type === 'exact' || row.score_type === 'partial' || row.score_type === 'none'
}
