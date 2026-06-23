import type { BetsTableItem } from '../models/betsTable'
import { formatBetResultLabel } from './betResult'
import { getBetActivityTimestamp } from './betTimestamps'
import type { CountryFilterOption } from './matchFilters'
import { normalizePersonNameKey } from './participantKey'
import { getTeamDisplayName } from './teamDisplay'

export type BetResultFilter = 'all' | 'exact' | 'partial' | 'none'
export type BetMatchStatusFilter = 'all' | 'finished' | 'live' | 'scheduled'
export type BetDateSortPreset = 'recent' | 'oldest'

export interface BetResultFilterOption {
  id: Exclude<BetResultFilter, 'all'>
  label: string
  count: number
}

export interface BetMatchStatusFilterOption {
  id: Exclude<BetMatchStatusFilter, 'all'>
  label: string
  count: number
}

export interface ParticipantFilterOption {
  id: string
  label: string
}

export const BET_RESULT_FILTER_OPTIONS: Array<{
  id: Exclude<BetResultFilter, 'all'>
  label: string
}> = [
  { id: 'exact', label: formatBetResultLabel('exact') },
  { id: 'partial', label: formatBetResultLabel('partial') },
  { id: 'none', label: formatBetResultLabel('none') },
]

export const BET_MATCH_STATUS_FILTER_OPTIONS: Array<{
  id: Exclude<BetMatchStatusFilter, 'all'>
  label: string
}> = [
  { id: 'finished', label: 'Encerrado' },
  { id: 'live', label: 'Ao vivo' },
  { id: 'scheduled', label: 'Agendado' },
]

export const BET_DATE_SORT_OPTIONS: { id: BetDateSortPreset; label: string }[] = [
  { id: 'recent', label: 'Mais recente' },
  { id: 'oldest', label: 'Mais antigo' },
]

function getMatchStatusBucket(match: BetsTableItem['match']): Exclude<BetMatchStatusFilter, 'all'> | null {
  if (!match) {
    return null
  }

  if (match.status === 'finished') {
    return 'finished'
  }

  if (match.isLive || match.status === 'live') {
    return 'live'
  }

  return 'scheduled'
}

const MATCH_STATUS_SORT_PRIORITY: Record<Exclude<BetMatchStatusFilter, 'all'>, number> = {
  live: 0,
  scheduled: 1,
  finished: 2,
}

function getGeneratedAtKey(item: BetsTableItem): string {
  return getBetActivityTimestamp(item.row.entry)
}

function getMatchStatusSortPriority(item: BetsTableItem): number {
  const bucket = getMatchStatusBucket(item.match)
  if (!bucket) {
    return MATCH_STATUS_SORT_PRIORITY.finished + 1
  }

  return MATCH_STATUS_SORT_PRIORITY[bucket]
}

function compareGeneratedAtKeys(a: string, b: string, preset: BetDateSortPreset): number {
  const result = a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  return preset === 'recent' ? -result : result
}

export function getBetResultFilterOptions(items: BetsTableItem[]): BetResultFilterOption[] {
  const counts = {
    exact: 0,
    partial: 0,
    none: 0,
  }

  for (const item of items) {
    if (item.row.resultStatus === 'exact') counts.exact += 1
    if (item.row.resultStatus === 'partial') counts.partial += 1
    if (item.row.resultStatus === 'none') counts.none += 1
  }

  return BET_RESULT_FILTER_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    count: counts[option.id],
  }))
}

export function getBetMatchStatusFilterOptions(items: BetsTableItem[]): BetMatchStatusFilterOption[] {
  const counts = {
    finished: 0,
    live: 0,
    scheduled: 0,
  }

  for (const item of items) {
    const bucket = getMatchStatusBucket(item.match)
    if (bucket) {
      counts[bucket] += 1
    }
  }

  return BET_MATCH_STATUS_FILTER_OPTIONS.map((option) => ({
    id: option.id,
    label: option.label,
    count: counts[option.id],
  }))
}

export function getBetCountryFilterOptions(items: BetsTableItem[]): CountryFilterOption[] {
  const teams = new Map<number, string>()

  for (const item of items) {
    if (!item.match) continue

    for (const team of [item.match.homeTeam, item.match.awayTeam]) {
      if (team.id == null) continue

      const label = getTeamDisplayName(team.shortName, team.name)
      if (label) {
        teams.set(team.id, label)
      }
    }
  }

  return [...teams.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function getBetParticipantFilterOptions(items: BetsTableItem[]): ParticipantFilterOption[] {
  const participants = new Map<string, string>()

  for (const item of items) {
    const key = normalizePersonNameKey(item.row.entry.personName)
    if (!key) continue

    if (!participants.has(key)) {
      participants.set(key, item.row.displayName)
    }
  }

  return [...participants.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function filterBetsByResult(
  items: BetsTableItem[],
  filter: BetResultFilter,
): BetsTableItem[] {
  if (filter === 'all') return items
  return items.filter((item) => item.row.resultStatus === filter)
}

export function filterBetsByMatchStatus(
  items: BetsTableItem[],
  filter: BetMatchStatusFilter,
): BetsTableItem[] {
  if (filter === 'all') return items

  return items.filter((item) => getMatchStatusBucket(item.match) === filter)
}

export function filterBetsByCountry(
  items: BetsTableItem[],
  countryId: number | null,
): BetsTableItem[] {
  if (countryId == null) return items

  return items.filter((item) => {
    if (!item.match) return false
    return item.match.homeTeam.id === countryId || item.match.awayTeam.id === countryId
  })
}

export function filterBetsByParticipant(
  items: BetsTableItem[],
  personNameKey: string | null,
): BetsTableItem[] {
  if (personNameKey == null) return items

  return items.filter(
    (item) => normalizePersonNameKey(item.row.entry.personName) === personNameKey,
  )
}

function getMatchDateKey(item: BetsTableItem): string {
  return item.match?.utcDate ?? item.row.entry.createdAt ?? ''
}

export function sortBetsByDatePreset(
  items: BetsTableItem[],
  preset: BetDateSortPreset,
): BetsTableItem[] {
  const sorted = [...items]

  sorted.sort((a, b) => {
    const byMatchDate = compareGeneratedAtKeys(
      getMatchDateKey(a),
      getMatchDateKey(b),
      preset,
    )

    if (byMatchDate !== 0) {
      return byMatchDate
    }

    const byStatus = getMatchStatusSortPriority(a) - getMatchStatusSortPriority(b)
    if (byStatus !== 0) {
      return byStatus
    }

    return compareGeneratedAtKeys(getGeneratedAtKey(a), getGeneratedAtKey(b), preset)
  })

  return sorted
}

export function hasActiveBetListFilters(
  resultFilter: BetResultFilter,
  statusFilter: BetMatchStatusFilter,
  countryId: number | null,
  dateSort: BetDateSortPreset,
  personNameKey: string | null = null,
): boolean {
  return (
    resultFilter !== 'all' ||
    statusFilter !== 'all' ||
    countryId != null ||
    personNameKey != null ||
    dateSort !== 'recent'
  )
}
