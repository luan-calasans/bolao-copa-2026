import { CHAMPION_BET_DEADLINE_OFFSET_MS } from './championBetConstants.js'

export const CHAMPION_BET_BLOCKED_MESSAGES = {
  noFinal: 'A final da Copa ainda não está definida no calendário.',
  finished: 'O palpite de campeão não está mais disponível porque a final já foi encerrada.',
  cancelled: 'A final foi cancelada e não aceita palpites de campeão.',
  deadlinePassed: 'O prazo para palpitar o campeão encerrou um dia antes da final.',
  invalidDeadline: 'Não foi possível definir o prazo do palpite de campeão.',
}

/**
 * @param {{ utcDate?: string } | null} finalMatch
 */
export function getChampionBetDeadlineMs(finalMatch) {
  const kickoffMs = Date.parse(finalMatch?.utcDate ?? '')

  if (Number.isNaN(kickoffMs)) {
    return null
  }

  return kickoffMs - CHAMPION_BET_DEADLINE_OFFSET_MS
}

/**
 * @param {{ status?: string, utcDate?: string } | null} finalMatch
 * @param {number} [nowMs]
 * @returns {string | null}
 */
export function getChampionBetBlockReason(finalMatch, nowMs = Date.now()) {
  if (!finalMatch) {
    return CHAMPION_BET_BLOCKED_MESSAGES.noFinal
  }

  if (finalMatch.status === 'finished') {
    return CHAMPION_BET_BLOCKED_MESSAGES.finished
  }

  if (finalMatch.status === 'cancelled') {
    return CHAMPION_BET_BLOCKED_MESSAGES.cancelled
  }

  const deadlineMs = getChampionBetDeadlineMs(finalMatch)

  if (deadlineMs == null) {
    return CHAMPION_BET_BLOCKED_MESSAGES.invalidDeadline
  }

  if (nowMs >= deadlineMs) {
    return CHAMPION_BET_BLOCKED_MESSAGES.deadlinePassed
  }

  return null
}

/**
 * @param {{ status?: string, utcDate?: string } | null} finalMatch
 * @param {number} [nowMs]
 */
export function canAcceptChampionBet(finalMatch, nowMs = Date.now()) {
  return getChampionBetBlockReason(finalMatch, nowMs) === null
}
