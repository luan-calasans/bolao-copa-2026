const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

const numericDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
})

function toValidDate(utcDate: string): Date | null {
  const date = new Date(utcDate)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatMatchDate(utcDate: string): string {
  const date = toValidDate(utcDate)
  if (!date) return '—'
  return dateFormatter.format(date)
}

export function formatMatchTime(utcDate: string): string {
  const date = toValidDate(utcDate)
  if (!date) return '—'
  return timeFormatter.format(date)
}

export function formatDateTime(isoDate: string): string {
  const date = toValidDate(isoDate)
  if (!date) return '—'
  return `${numericDateFormatter.format(date)} às ${timeFormatter.format(date)}`
}

export function formatStage(stage: string): string {
  const stages: Record<string, string> = {
    GROUP_STAGE: 'Fase de Grupos',
    LAST_32: '16 avos de Final',
    LAST_16: 'Oitavas de Final',
    QUARTER_FINALS: 'Quartas de Final',
    SEMI_FINALS: 'Semifinal',
    THIRD_PLACE: 'Disputa 3º Lugar',
    FINAL: 'Final',
    ROUND_OF_16: 'Oitavas de Final',
  }

  return stages[stage] ?? stage.replace(/_/g, ' ')
}

const cardDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatMatchCardDate(utcDate: string): string {
  const date = toValidDate(utcDate)
  if (!date) return '—'
  return cardDateFormatter.format(date).replace(/\./g, '')
}

export function formatGroup(group: string | null): string {
  if (!group?.trim()) return ''
  return group.replace(/^GROUP_/i, 'Grupo ')
}

export function formatMatchCardMeta(utcDate: string, group: string | null): string {
  const time = formatMatchTime(utcDate)
  const groupLabel = formatGroup(group)
  return groupLabel ? `${time} • ${groupLabel}` : time
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatRelativeTime(isoDate: string, now = Date.now()): string {
  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return ''

  const diffSec = Math.round((then - now) / 1000)
  const absSec = Math.abs(diffSec)

  if (absSec < 60) return relativeTimeFormatter.format(diffSec, 'second')

  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return relativeTimeFormatter.format(diffMin, 'minute')

  const diffHour = Math.round(diffSec / 3600)
  if (Math.abs(diffHour) < 24) return relativeTimeFormatter.format(diffHour, 'hour')

  const diffDay = Math.round(diffSec / 86400)
  return relativeTimeFormatter.format(diffDay, 'day')
}
