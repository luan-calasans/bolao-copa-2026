import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { MatchGroups } from '../models/match'
import { fetchWorldCupMatchesBundle } from '../services/matchService'
import {
  filterGroupsByDate,
  getDateFilterEmptyMessage,
  type DateFilterPreset,
  type DateFilterState,
} from '../utils/dateFilters'
import { toLoadError, type LoadError } from '../utils/errorMessages'
import { groupMatchesByStatus } from '../utils/matchMapper'
import {
  filterGroupsByCountry,
  getCountryFilterOptions,
  getFilterEmptyMessage,
  getFilterOptions,
  getFilteredGroups,
  hasVisibleMatches,
  type CountryFilterOption,
  type MatchFilter,
  type MatchFilterOption,
} from '../utils/matchFilters'

const EMPTY_GROUPS: MatchGroups = {
  live: [],
  upcoming: [],
  finished: [],
  undefined: [],
}

const DEFAULT_DATE_FILTER: DateFilterState = {
  preset: 'all',
}

const AUTO_REFRESH_MS = 60_000
const LIVE_AUTO_REFRESH_MS = 15_000

export interface HomeViewModelState {
  groups: MatchGroups
  filter: MatchFilter
  filterOptions: MatchFilterOption[]
  dateFilter: DateFilterState
  countryFilterOptions: CountryFilterOption[]
  selectedCountryId: number | null
  visibleGroups: MatchGroups
  isLoading: boolean
  isReloading: boolean
  error: LoadError | null
  isEmpty: boolean
  isFilterEmpty: boolean
  filterEmptyMessage: string
  hasActiveFilters: boolean
  lastFetchedAt: string | null
}

export interface HomeViewModelActions {
  reload: () => void
  setFilter: (filter: MatchFilter) => void
  setDateFilterPreset: (preset: DateFilterPreset) => void
  setSelectedCountryId: (countryId: number | null) => void
  clearFilters: () => void
}

function resolveFilter(filter: MatchFilter, filterOptions: MatchFilterOption[]): MatchFilter {
  const availableFilters = new Set(filterOptions.map((option) => option.id))
  return availableFilters.has(filter) ? filter : 'all'
}

export function useHomeViewModel(): HomeViewModelState & HomeViewModelActions {
  const location = useLocation()
  const [groups, setGroups] = useState<MatchGroups>(EMPTY_GROUPS)
  const [filter, setFilter] = useState<MatchFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER)
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [error, setError] = useState<LoadError | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const isInitialLoadRef = useRef(true)
  const hasLiveMatches = groups.live.length > 0

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const applyMatchesBundle = useCallback(
    (bundle: Awaited<ReturnType<typeof fetchWorldCupMatchesBundle>>) => {
      setGroups({
        ...groupMatchesByStatus(bundle.matches),
        undefined: bundle.undefinedMatches,
      })
      setLastFetchedAt(bundle.fetchedAt)
    },
    [],
  )

  const fetchAndApplyMatches = useCallback(async (force = false) => {
    const bundle = await fetchWorldCupMatchesBundle(force ? { force: true } : undefined)
    if (!isMountedRef.current) return
    applyMatchesBundle(bundle)
    setError(null)
  }, [applyMatchesBundle])

  const silentReload = useCallback(async (force = false) => {
    try {
      await fetchAndApplyMatches(force)
    } catch (err) {
      if (!isMountedRef.current) return
      setError(toLoadError(err))
    }
  }, [fetchAndApplyMatches])

  useEffect(() => {
    let cancelled = false
    const showLoading = isInitialLoadRef.current

    async function load() {
      if (showLoading) {
        setIsLoading(true)
      }

      try {
        await fetchAndApplyMatches()
      } catch (err) {
        if (cancelled || !isMountedRef.current) return
        setError(toLoadError(err))
      } finally {
        if (!cancelled && isMountedRef.current) {
          setIsLoading(false)
          isInitialLoadRef.current = false
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [location.key, fetchAndApplyMatches])

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return
      void silentReload()
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      void silentReload()
    }

    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [silentReload])

  const reload = useCallback(async () => {
    setIsReloading(true)
    setError(null)

    try {
      await fetchAndApplyMatches(true)
    } catch (err) {
      if (!isMountedRef.current) return
      setError(toLoadError(err))
    } finally {
      if (isMountedRef.current) {
        setIsReloading(false)
      }
    }
  }, [fetchAndApplyMatches])

  useEffect(() => {
    if (isLoading || error) return

    let cancelled = false
    let timeoutId = 0
    const refreshMs = hasLiveMatches ? LIVE_AUTO_REFRESH_MS : AUTO_REFRESH_MS

    async function poll() {
      if (cancelled) return

      await silentReload(true)

      if (cancelled) return

      timeoutId = window.setTimeout(() => {
        void poll()
      }, refreshMs)
    }

    timeoutId = window.setTimeout(() => {
      void poll()
    }, refreshMs)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [isLoading, error, silentReload, hasLiveMatches])

  const dateAndCountryGroups = useMemo(() => {
    const byDate = filterGroupsByDate(groups, dateFilter)
    return filterGroupsByCountry(byDate, selectedCountryId)
  }, [groups, dateFilter, selectedCountryId])

  const countryFilterOptions = useMemo(() => getCountryFilterOptions(groups), [groups])
  const filterOptions = useMemo(
    () => getFilterOptions(dateAndCountryGroups),
    [dateAndCountryGroups],
  )

  const activeFilter = useMemo(() => resolveFilter(filter, filterOptions), [filter, filterOptions])

  const visibleGroups = useMemo(
    () => getFilteredGroups(dateAndCountryGroups, activeFilter),
    [dateAndCountryGroups, activeFilter],
  )

  const isEmpty = useMemo(
    () =>
      !isLoading &&
      !error &&
      groups.live.length === 0 &&
      groups.upcoming.length === 0 &&
      groups.finished.length === 0 &&
      groups.undefined.length === 0,
    [isLoading, error, groups],
  )

  const isFilterEmpty = useMemo(
    () => !isLoading && !error && !isEmpty && !hasVisibleMatches(visibleGroups),
    [isLoading, error, isEmpty, visibleGroups],
  )

  const filterEmptyMessage = useMemo(() => {
    if (dateFilter.preset !== 'all') {
      return getDateFilterEmptyMessage(dateFilter)
    }

    if (selectedCountryId != null) {
      const country = countryFilterOptions.find((option) => option.id === selectedCountryId)
      return country
        ? `Nenhum jogo encontrado para ${country.label}.`
        : 'Nenhum jogo encontrado para o país selecionado.'
    }

    return getFilterEmptyMessage(activeFilter)
  }, [dateFilter, selectedCountryId, countryFilterOptions, activeFilter])

  const setDateFilterPreset = useCallback((preset: DateFilterPreset) => {
    setDateFilter({ preset })
  }, [])

  const hasActiveFilters = useMemo(
    () => activeFilter !== 'all' || dateFilter.preset !== 'all' || selectedCountryId != null,
    [activeFilter, dateFilter.preset, selectedCountryId],
  )

  const clearFilters = useCallback(() => {
    setFilter('all')
    setDateFilter(DEFAULT_DATE_FILTER)
    setSelectedCountryId(null)
  }, [])

  return {
    groups,
    filter: activeFilter,
    filterOptions,
    dateFilter,
    countryFilterOptions,
    selectedCountryId,
    visibleGroups,
    isLoading,
    isReloading,
    error,
    isEmpty,
    isFilterEmpty,
    filterEmptyMessage,
    hasActiveFilters,
    lastFetchedAt,
    reload,
    setFilter,
    setDateFilterPreset,
    setSelectedCountryId,
    clearFilters,
  }
}
