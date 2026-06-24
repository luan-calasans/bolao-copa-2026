import type { BetsTableItem } from '../models/betsTable'
import {
  canParticipantDeleteByMatchStatus,
  PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE,
  PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE,
} from '../../shared/participantBetDeletion.js'

export {
  PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE,
  PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE,
}

export function canParticipantDeleteBetItem(item: BetsTableItem): boolean {
  const status = item.match?.status
  if (!status) return true
  return canParticipantDeleteByMatchStatus(status)
}

export function getParticipantDeleteBlockedMessage(item: BetsTableItem): string {
  return item.championTeam
    ? PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE
    : PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE
}
