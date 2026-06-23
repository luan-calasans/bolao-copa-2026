export interface BetComplementFields {
  homeScore?: number | null
  awayScore?: number | null
  winnerPick?: string | null
}

export function mergeBetComplement(
  existing: BetComplementFields,
  incoming: BetComplementFields,
): Required<BetComplementFields>

export function isBetComplementable(bet: BetComplementFields): boolean

export function validateBetComplement(
  existing: BetComplementFields,
  incoming: BetComplementFields,
): string | null
