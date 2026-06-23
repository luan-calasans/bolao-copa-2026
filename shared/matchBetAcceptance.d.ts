export type BetAcceptanceStatus =
  | 'scheduled'
  | 'live'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'other'

export interface BetAcceptanceInput {
  teamsDefined: boolean
  status: BetAcceptanceStatus | string
  utcDate?: string
}

export const BET_BLOCKED_MESSAGES: {
  noTeams: string
  finished: string
  cancelled: string
  postponed: string
  kickoffPassed: string
  other: string
}

export function getBetAcceptanceBlockReason(
  input: BetAcceptanceInput,
  nowMs?: number,
): string | null

export function canAcceptBets(input: BetAcceptanceInput, nowMs?: number): boolean
