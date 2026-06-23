import { normalizePersonNameKey } from './participantKey'

export function getParticipantBetsPathFromKey(personNameKey: string): string {
  return `/participante/${encodeURIComponent(personNameKey)}`
}

export function getParticipantBetsPathFromName(personName: string): string {
  return getParticipantBetsPathFromKey(normalizePersonNameKey(personName))
}
