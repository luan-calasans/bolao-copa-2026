import { useMemo, useState } from 'react'
import type { BetsTableItem } from '../models/betsTable'
import type { BetsMatchGroup } from '../utils/matchBetRows'
import {
  filterBetsByCountry,
  filterBetsByMatchStatus,
  filterBetsByParticipant,
  filterBetsByResult,
  getBetCountryFilterOptions,
  getBetMatchStatusFilterOptions,
  getBetParticipantFilterOptions,
  getBetResultFilterOptions,
  hasActiveBetListFilters,
  sortBetsByDatePreset,
  type BetDateSortPreset,
  type BetMatchStatusFilter,
  type BetResultFilter,
} from '../utils/betListFilters'
import { buildBetsTableItems } from '../utils/betsTableItems'
import { matchesBetSearchQuery } from '../utils/betSearch'

export interface UseBetsTableFiltersOptions {
  resultFilter?: BetResultFilter
  onResultFilterChange?: (filter: BetResultFilter) => void
}

export function useBetsTableFilters(
  groups: BetsMatchGroup[],
  options?: UseBetsTableFiltersOptions,
) {
  const [searchQuery, setSearchQuery] = useState('')
  const [internalResultFilter, setInternalResultFilter] = useState<BetResultFilter>('all')
  const resultFilter = options?.resultFilter ?? internalResultFilter
  const setResultFilter = options?.onResultFilterChange ?? setInternalResultFilter
  const [statusFilter, setStatusFilter] = useState<BetMatchStatusFilter>('all')
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
  const [selectedParticipantKey, setSelectedParticipantKey] = useState<string | null>(null)
  const [dateSort, setDateSort] = useState<BetDateSortPreset>('recent')

  const tableItems = useMemo(() => buildBetsTableItems(groups), [groups])

  const searchFilteredItems = useMemo(
    () =>
      tableItems.filter((item) =>
        matchesBetSearchQuery(searchQuery, {
          displayName: item.row.displayName,
          match: item.match,
          matchId: item.matchId,
          championTeam: item.championTeam,
        }),
      ),
    [tableItems, searchQuery],
  )

  const resultFilterOptions = useMemo(
    () => getBetResultFilterOptions(searchFilteredItems),
    [searchFilteredItems],
  )

  const statusFilterOptions = useMemo(
    () => getBetMatchStatusFilterOptions(searchFilteredItems),
    [searchFilteredItems],
  )

  const countryFilterOptions = useMemo(
    () => getBetCountryFilterOptions(searchFilteredItems),
    [searchFilteredItems],
  )

  const participantFilterOptions = useMemo(
    () => getBetParticipantFilterOptions(searchFilteredItems),
    [searchFilteredItems],
  )

  const filteredItems = useMemo(() => {
    const byResult = filterBetsByResult(searchFilteredItems, resultFilter)
    const byStatus = filterBetsByMatchStatus(byResult, statusFilter)
    const byCountry = filterBetsByCountry(byStatus, selectedCountryId)
    const byParticipant = filterBetsByParticipant(byCountry, selectedParticipantKey)
    return sortBetsByDatePreset(byParticipant, dateSort)
  }, [
    searchFilteredItems,
    resultFilter,
    statusFilter,
    selectedCountryId,
    selectedParticipantKey,
    dateSort,
  ])

  const hasSearchQuery = searchQuery.trim().length > 0
  const hasActiveFilters = hasActiveBetListFilters(
    resultFilter,
    statusFilter,
    selectedCountryId,
    dateSort,
    selectedParticipantKey,
  )
  const isSearchEmpty = hasSearchQuery && filteredItems.length === 0
  const isFilterEmpty = !hasSearchQuery && hasActiveFilters && filteredItems.length === 0
  const hasClearableFilters = hasActiveFilters || hasSearchQuery

  function clearFilters() {
    setSearchQuery('')
    setResultFilter('all')
    setStatusFilter('all')
    setSelectedCountryId(null)
    setSelectedParticipantKey(null)
    setDateSort('recent')
  }

  return {
    searchQuery,
    setSearchQuery,
    resultFilter,
    setResultFilter,
    resultFilterOptions,
    statusFilter,
    setStatusFilter,
    statusFilterOptions,
    selectedCountryId,
    setSelectedCountryId,
    countryFilterOptions,
    selectedParticipantKey,
    setSelectedParticipantKey,
    participantFilterOptions,
    dateSort,
    setDateSort,
    filteredItems,
    hasSearchQuery,
    hasActiveFilters,
    hasClearableFilters,
    isSearchEmpty,
    isFilterEmpty,
    clearFilters,
  }
}

export type { BetsTableItem }
