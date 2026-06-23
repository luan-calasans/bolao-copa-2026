export const CHAMPION_BET_BLOCKED_MESSAGES: {
  noFinal: string
  finished: string
  cancelled: string
  deadlinePassed: string
  invalidDeadline: string
}

export function getChampionBetDeadlineMs(
  finalMatch: { utcDate?: string } | null,
): number | null

export function getChampionBetBlockReason(
  finalMatch: { status?: string; utcDate?: string } | null,
  nowMs?: number,
): string | null

export function canAcceptChampionBet(
  finalMatch: { status?: string; utcDate?: string } | null,
  nowMs?: number,
): boolean
