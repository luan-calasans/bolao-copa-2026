import { useCallback, useMemo } from 'react'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchHistoricalAggregateData } from '../services/historicalWorldCupService'

export function useHistoricoViewModel() {
  const loadFn = useCallback(() => fetchHistoricalAggregateData(), [])

  const { data, isLoading, error, reload } = useAsyncResource(loadFn, [])

  const isEmpty = useMemo(
    () => !isLoading && !error && (data?.summaries.length ?? 0) === 0,
    [data?.summaries.length, error, isLoading],
  )

  return {
    summaries: data?.summaries ?? [],
    teamStats: data?.teamStats ?? [],
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
