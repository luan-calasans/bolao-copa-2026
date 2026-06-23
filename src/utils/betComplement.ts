import {
  isBetComplementable as isBetComplementableShared,
  mergeBetComplement as mergeBetComplementShared,
  validateBetComplement as validateBetComplementShared,
  type BetComplementFields,
} from '../../shared/betComplement.js'
import type { WinnerPick } from '../models/winnerPick'

export type { BetComplementFields }

export function mergeBetComplement(existing: BetComplementFields, incoming: BetComplementFields) {
  return mergeBetComplementShared(existing, incoming)
}

export function isBetComplementable(bet: BetComplementFields): boolean {
  return isBetComplementableShared(bet)
}

export function validateBetComplement(
  existing: BetComplementFields,
  incoming: BetComplementFields,
): string | null {
  return validateBetComplementShared(existing, incoming)
}

export function toBetComplementFields(bet: {
  homeScore?: number | null
  awayScore?: number | null
  winnerPick?: WinnerPick | null
}): BetComplementFields {
  return {
    homeScore: bet.homeScore ?? null,
    awayScore: bet.awayScore ?? null,
    winnerPick: bet.winnerPick ?? null,
  }
}
