export type MatchSide = 'home' | 'away' | 'draw'

export type MatchResultLike = {
  score: { home: number | null; away: number | null }
  penalties?: { home: number | null; away: number | null } | null
  extraTime?: { home: number | null; away: number | null } | null
  winner?: MatchSide | 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
}

export function normalizeMatchWinner(
  winner: MatchResultLike['winner'],
): MatchSide | null

export function getExtraTimeFullScore(
  match: MatchResultLike,
): { home: number; away: number } | null

export function resolveMatchWinner(match: MatchResultLike): MatchSide | null
