export const BET_BLOCKED_MESSAGES = {
  noTeams: 'Este jogo ainda não tem times definidos e não aceita palpites.',
  finished: 'Este jogo já foi encerrado e não aceita mais palpites.',
  cancelled: 'Este jogo foi cancelado e não aceita palpites.',
  postponed: 'Este jogo foi adiado e não aceita palpites no momento.',
  kickoffPassed: 'Este jogo já iniciou e não aceita novos palpites.',
  other: 'Este jogo não está disponível para palpites.',
}

/**
 * @param {{ teamsDefined: boolean, status: string, utcDate?: string }} input
 * @param {number} [nowMs]
 * @returns {string | null}
 */
export function getBetAcceptanceBlockReason(input, nowMs = Date.now()) {
  const { teamsDefined, status, utcDate } = input

  if (!teamsDefined) {
    return BET_BLOCKED_MESSAGES.noTeams
  }

  if (status === 'finished') {
    return BET_BLOCKED_MESSAGES.finished
  }

  if (status === 'cancelled') {
    return BET_BLOCKED_MESSAGES.cancelled
  }

  if (status === 'postponed') {
    return BET_BLOCKED_MESSAGES.postponed
  }

  if (status !== 'scheduled' && status !== 'live') {
    return BET_BLOCKED_MESSAGES.other
  }

  const kickoffMs = Date.parse(utcDate ?? '')

  if (status === 'scheduled' && !Number.isNaN(kickoffMs) && nowMs >= kickoffMs) {
    return BET_BLOCKED_MESSAGES.kickoffPassed
  }

  return null
}

/**
 * @param {{ teamsDefined: boolean, status: string, utcDate?: string }} input
 * @param {number} [nowMs]
 */
export function canAcceptBets(input, nowMs = Date.now()) {
  return getBetAcceptanceBlockReason(input, nowMs) === null
}
