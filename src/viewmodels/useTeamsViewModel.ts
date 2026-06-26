import { useCallback, useMemo } from 'react'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchWorldCupTeamsFromSeasonJson } from '../services/competitionService'
import { getTeamDisplayName } from '../utils/teamDisplay'

export function useTeamsViewModel() {
  const loadTeams = useCallback(async (forceRefresh = false) => {
    const response = await fetchWorldCupTeamsFromSeasonJson(
      forceRefresh ? { force: true } : undefined,
    )
    return response.teams ?? []
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadTeams, [])

  const teams = useMemo(() => {
    const source = data ?? []

    return [...source].sort((a, b) =>
      getTeamDisplayName(a.shortName, a.name).localeCompare(
        getTeamDisplayName(b.shortName, b.name),
        'pt-BR',
      ),
    )
  }, [data])

  const isEmpty = !isLoading && !error && teams.length === 0
  const showLoading = isLoading && teams.length === 0

  return {
    teams,
    isLoading: showLoading,
    error,
    isEmpty,
    reload,
  }
}
