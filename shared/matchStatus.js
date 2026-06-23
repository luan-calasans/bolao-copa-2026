export const LIVE_STATUSES = ['LIVE', 'IN_PLAY', 'PAUSED']
export const FINISHED_STATUSES = ['FINISHED', 'AWARDED']
export const SCHEDULED_STATUSES = ['SCHEDULED', 'TIMED']
export const POSTPONED_STATUSES = ['POSTPONED', 'SUSPENDED']

export function isLiveStatus(status) {
  return LIVE_STATUSES.includes(status)
}

export function normalizeMatchStatus(status) {
  if (LIVE_STATUSES.includes(status)) return 'live'
  if (FINISHED_STATUSES.includes(status)) return 'finished'
  if (SCHEDULED_STATUSES.includes(status)) return 'scheduled'
  if (POSTPONED_STATUSES.includes(status)) return 'postponed'
  if (status === 'CANCELLED') return 'cancelled'
  return 'other'
}
