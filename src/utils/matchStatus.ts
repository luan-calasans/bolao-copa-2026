import type { ApiMatchStatus } from '../models/api.types'
import type { Match, MatchStatus } from '../models/match'
import {
  canAcceptBets as canAcceptBetsShared,
  getBetAcceptanceBlockReason as getBetAcceptanceBlockReasonShared,
} from '../../shared/matchBetAcceptance.js'
import {
  isLiveStatus as isLiveStatusShared,
  normalizeMatchStatus as normalizeMatchStatusShared,
} from '../../shared/matchStatus.js'
import { areMatchTeamsDefined } from './teamDisplay'

export function isLiveStatus(status: ApiMatchStatus): boolean {
  return isLiveStatusShared(status)
}

export function normalizeMatchStatus(status: ApiMatchStatus): MatchStatus {
  return normalizeMatchStatusShared(status) as MatchStatus
}

const NORMALIZED_TO_RAW_STATUS: Record<MatchStatus, string> = {
  scheduled: 'SCHEDULED',
  live: 'IN_PLAY',
  finished: 'FINISHED',
  postponed: 'POSTPONED',
  cancelled: 'CANCELLED',
  other: 'SCHEDULED',
}

export function toApiRawStatus(status: string): string {
  const normalized = status.toLowerCase() as MatchStatus
  if (normalized in NORMALIZED_TO_RAW_STATUS) {
    return NORMALIZED_TO_RAW_STATUS[normalized]
  }

  return status
}

const NORMALIZED_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Agendado',
  live: 'Ao vivo',
  finished: 'Encerrado',
  postponed: 'Adiado',
  cancelled: 'Cancelado',
  other: 'Outro',
}

export function getStatusLabel(rawStatus: string, minute: number | null): string {
  const labels: Record<string, string> = {
    SCHEDULED: 'Agendado',
    TIMED: 'Agendado',
    LIVE: 'Ao vivo',
    IN_PLAY: minute ? `${minute}'` : 'Ao vivo',
    PAUSED: 'Intervalo',
    FINISHED: 'Encerrado',
    POSTPONED: 'Adiado',
    SUSPENDED: 'Suspenso',
    CANCELLED: 'Cancelado',
    AWARDED: 'Encerrado',
  }

  if (labels[rawStatus]) {
    return labels[rawStatus]
  }

  const normalized = rawStatus.toLowerCase() as MatchStatus
  if (normalized in NORMALIZED_STATUS_LABELS) {
    return NORMALIZED_STATUS_LABELS[normalized]
  }

  return rawStatus
}

function toBetAcceptanceInput(match: Match) {
  return {
    teamsDefined: areMatchTeamsDefined(match),
    status: match.status,
    utcDate: match.utcDate,
  }
}

export function canPlaceBet(match: Match, nowMs = Date.now()): boolean {
  return canAcceptBetsShared(toBetAcceptanceInput(match), nowMs)
}

export function getBetBlockedMessage(match: Match, nowMs = Date.now()): string | null {
  return getBetAcceptanceBlockReasonShared(toBetAcceptanceInput(match), nowMs)
}
