export type ApiScoreLike = {
  fullTime?: { home: number | null; away: number | null } | null
  regularTime?: { home: number | null; away: number | null } | null
  extraTime?: { home: number | null; away: number | null } | null
  penalties?: { home: number | null; away: number | null } | null
}

export function resolveRegulationScoreFromApi(
  apiScore: ApiScoreLike | null | undefined,
): { home: number | null; away: number | null }

export function resolvePenaltyScoreFromApi(
  apiScore: ApiScoreLike | null | undefined,
): { home: number; away: number } | null
