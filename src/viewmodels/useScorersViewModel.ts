import { useCallback, useMemo } from 'react'
import type { ApiScorer } from '../models/api.types'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchWorldCupScorers } from '../services/competitionService'

interface ScorersData {
  scorers: ApiScorer[]
}

export function useScorersViewModel() {
  const loadScorers = useCallback(async (forceRefresh = false): Promise<ScorersData> => {
    const options = forceRefresh ? { force: true as const } : undefined
    const response = await fetchWorldCupScorers(undefined, options)

    return {
      scorers: response.scorers ?? [],
    }
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadScorers, [])

  const scorers = useMemo(() => data?.scorers ?? [], [data?.scorers])
  const isEmpty = !isLoading && !error && scorers.length === 0

  return {
    scorers,
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
