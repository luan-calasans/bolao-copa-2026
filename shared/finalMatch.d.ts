export function findWorldCupFinalMatch<T extends { stage?: string; utcDate?: string }>(
  matches: T[],
): T | null

export function getChampionTeamIdFromFinal(finalMatch: {
  status?: string
  homeTeam?: { id?: number | null }
  awayTeam?: { id?: number | null }
  score?: {
    winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
    home?: number | null
    away?: number | null
  }
} | null): number | null
