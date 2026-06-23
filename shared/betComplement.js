import { hasBetScorePick } from './betValidation.js'
import { isValidWinnerPick } from './winnerPick.js'

/**
 * @param {{
 *   homeScore?: number | null
 *   awayScore?: number | null
 *   winnerPick?: string | null
 * }} existing
 * @param {{
 *   homeScore?: number | null
 *   awayScore?: number | null
 *   winnerPick?: string | null
 * }} incoming
 */
export function mergeBetComplement(existing, incoming) {
  return {
    homeScore: existing.homeScore ?? incoming.homeScore ?? null,
    awayScore: existing.awayScore ?? incoming.awayScore ?? null,
    winnerPick: existing.winnerPick ?? incoming.winnerPick ?? null,
  }
}

/**
 * @param {{
 *   homeScore?: number | null
 *   awayScore?: number | null
 *   winnerPick?: string | null
 * }} bet
 */
export function isBetComplementable(bet) {
  const hasScore = hasBetScorePick(bet.homeScore, bet.awayScore)
  const hasWinner = isValidWinnerPick(bet.winnerPick)
  return !hasScore || !hasWinner
}

/**
 * @param {{
 *   homeScore?: number | null
 *   awayScore?: number | null
 *   winnerPick?: string | null
 * }} existing
 * @param {{
 *   homeScore?: number | null
 *   awayScore?: number | null
 *   winnerPick?: string | null
 * }} incoming
 * @returns {string | null}
 */
export function validateBetComplement(existing, incoming) {
  const existingHasScore = hasBetScorePick(existing.homeScore, existing.awayScore)
  const existingHasWinner = isValidWinnerPick(existing.winnerPick)
  const incomingHasScore = hasBetScorePick(incoming.homeScore, incoming.awayScore)
  const incomingHasWinner = isValidWinnerPick(incoming.winnerPick)

  if (existingHasScore && incomingHasScore) {
    if (
      existing.homeScore !== incoming.homeScore ||
      existing.awayScore !== incoming.awayScore
    ) {
      return 'Você já registrou o placar deste jogo. Não é possível alterá-lo.'
    }
  }

  if (existingHasWinner && incomingHasWinner && existing.winnerPick !== incoming.winnerPick) {
    return 'Você já registrou quem vence neste jogo. Não é possível alterar.'
  }

  if (!isBetComplementable(existing)) {
    return 'Você já registrou um palpite completo para este jogo.'
  }

  const merged = mergeBetComplement(existing, incoming)
  const addedWinner = !existingHasWinner && isValidWinnerPick(merged.winnerPick)
  const addedScore = !existingHasScore && hasBetScorePick(merged.homeScore, merged.awayScore)

  if (!addedWinner && !addedScore) {
    return 'Informe a opção que ainda falta no seu palpite.'
  }

  return null
}
