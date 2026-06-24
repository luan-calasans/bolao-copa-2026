export const PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE =
  'Não é possível excluir um palpite de jogo encerrado.'

export const PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE =
  'Não é possível excluir o palpite de campeão porque a final já foi encerrada.'

/**
 * @param {string | null | undefined} matchStatus Normalized match status.
 */
export function canParticipantDeleteByMatchStatus(matchStatus) {
  return matchStatus !== 'finished'
}
