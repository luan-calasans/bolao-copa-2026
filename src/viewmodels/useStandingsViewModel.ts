import { useCallback, useMemo, useState } from 'react'
import type { ApiStandingTable } from '../models/api.types'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchWorldCupStandings } from '../services/competitionService'
import { fetchWorldCupMatches } from '../services/matchService'
import {
  filterStandingsByCountry,
  getStandingsCountryFilterOptions,
} from '../utils/standingsFilters'
import { resolveGroupStandings } from '../utils/standingsBuilder'

interface StandingsData {
  standings: ApiStandingTable[]
}

export function useStandingsViewModel() {
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)

  const loadStandings = useCallback(async (forceRefresh = false): Promise<StandingsData> => {
    const options = forceRefresh ? { force: true as const } : undefined
    const [standingsResult, matchesResult] = await Promise.allSettled([
      fetchWorldCupStandings(undefined, options),
      fetchWorldCupMatches(options),
    ])

    if (standingsResult.status === 'rejected' && matchesResult.status === 'rejected') {
      throw standingsResult.reason
    }

    const response =
      standingsResult.status === 'fulfilled'
        ? standingsResult.value
        : { standings: [] as ApiStandingTable[] }

    const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : []

    return {
      standings: resolveGroupStandings(response.standings ?? [], matches),
    }
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadStandings, [])

  const allStandings = useMemo(() => data?.standings ?? [], [data?.standings])
  const isEmpty = !isLoading && !error && allStandings.length === 0

  const countryFilterOptions = useMemo(
    () => getStandingsCountryFilterOptions(allStandings),
    [allStandings],
  )

  const visibleStandings = useMemo(
    () => filterStandingsByCountry(allStandings, selectedCountryId),
    [allStandings, selectedCountryId],
  )

  const isFilterEmpty = useMemo(
    () => !isLoading && !error && !isEmpty && visibleStandings.length === 0,
    [isLoading, error, isEmpty, visibleStandings],
  )

  const filterEmptyMessage = useMemo(() => {
    if (selectedCountryId == null) {
      return 'Nenhum grupo encontrado com os filtros selecionados.'
    }

    const country = countryFilterOptions.find((option) => option.id === selectedCountryId)
    return country
      ? `Nenhum grupo encontrado para ${country.label}.`
      : 'Nenhum grupo encontrado para o país selecionado.'
  }, [selectedCountryId, countryFilterOptions])

  const hasActiveFilters = selectedCountryId != null

  const clearFilters = useCallback(() => {
    setSelectedCountryId(null)
  }, [])

  return {
    standings: visibleStandings,
    countryFilterOptions,
    selectedCountryId,
    isLoading,
    error,
    isEmpty,
    isFilterEmpty,
    filterEmptyMessage,
    hasActiveFilters,
    reload,
    setSelectedCountryId,
    clearFilters,
  }
}
