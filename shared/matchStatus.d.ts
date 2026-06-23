export type NormalizedMatchStatus =
  | 'live'
  | 'finished'
  | 'scheduled'
  | 'postponed'
  | 'cancelled'
  | 'other'

export const LIVE_STATUSES: readonly string[]
export const FINISHED_STATUSES: readonly string[]
export const SCHEDULED_STATUSES: readonly string[]
export const POSTPONED_STATUSES: readonly string[]

export function isLiveStatus(status: string): boolean
export function normalizeMatchStatus(status: string): NormalizedMatchStatus
