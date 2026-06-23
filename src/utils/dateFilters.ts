import type { Match, MatchGroups } from '../models/match'

export type DateFilterPreset = 'all' | 'today' | 'tomorrow' | 'nextWeek'

export interface DateFilterState {
  preset: DateFilterPreset
}

export interface DateFilterOption {
  id: DateFilterPreset
  label: string
}

export const DATE_FILTER_OPTIONS: DateFilterOption[] = [
  { id: 'all', label: 'Todas as datas' },
  { id: 'today', label: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã' },
  { id: 'nextWeek', label: 'Próxima semana' },
]

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

function getMonday(date: Date): Date {
  const monday = startOfDay(date)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  return monday
}

function getWeekRange(monday: Date): { start: Date; end: Date } {
  const start = startOfDay(monday)
  const end = endOfDay(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6))
  return { start, end }
}

export function getDateFilterRange(filter: DateFilterState): { start: Date; end: Date } | null {
  const now = new Date()
  const today = startOfDay(now)

  switch (filter.preset) {
    case 'all':
      return null
    case 'today':
      return { start: today, end: endOfDay(today) }
    case 'tomorrow': {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return { start: tomorrow, end: endOfDay(tomorrow) }
    }
    case 'nextWeek': {
      const currentMonday = getMonday(now)
      const nextMonday = new Date(currentMonday)
      nextMonday.setDate(nextMonday.getDate() + 7)
      return getWeekRange(nextMonday)
    }
    default:
      return null
  }
}

export function matchMatchesDateFilter(match: Match, filter: DateFilterState): boolean {
  const range = getDateFilterRange(filter)
  if (!range) return true

  const matchDate = new Date(match.utcDate)
  return matchDate >= range.start && matchDate <= range.end
}

export function filterGroupsByDate(groups: MatchGroups, filter: DateFilterState): MatchGroups {
  if (filter.preset === 'all') return groups

  return {
    live: groups.live.filter((match) => matchMatchesDateFilter(match, filter)),
    upcoming: groups.upcoming.filter((match) => matchMatchesDateFilter(match, filter)),
    finished: groups.finished.filter((match) => matchMatchesDateFilter(match, filter)),
    undefined: groups.undefined.filter((match) => matchMatchesDateFilter(match, filter)),
  }
}

export function getDateFilterEmptyMessage(filter: DateFilterState): string {
  const labels: Record<DateFilterPreset, string> = {
    all: 'Não há jogos disponíveis no momento.',
    today: 'Nenhum jogo hoje.',
    tomorrow: 'Nenhum jogo amanhã.',
    nextWeek: 'Nenhum jogo na próxima semana.',
  }

  return labels[filter.preset]
}
