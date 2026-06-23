import { useCallback } from 'react'
import type { ApiStandingTable } from '../models/api.types'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchWorldCupStandings } from '../services/competitionService'
import { fetchWorldCupMatchesForKnockout } from '../services/matchService'
import { buildKnockoutBracket } from '../utils/knockoutBracketBuilder'
import { resolveGroupStandings } from '../utils/standingsBuilder'

export function useKnockoutViewModel() {
  const loadKnockout = useCallback(async (forceRefresh = false) => {
    const options = forceRefresh ? { force: true as const } : undefined
    const [standingsResult, matchesResult] = await Promise.allSettled([
      fetchWorldCupStandings(undefined, options),
      fetchWorldCupMatchesForKnockout(options),
    ])

    if (standingsResult.status === 'rejected' && matchesResult.status === 'rejected') {
      throw standingsResult.reason
    }

    const standingsResponse =
      standingsResult.status === 'fulfilled'
        ? standingsResult.value
        : { standings: [] as ApiStandingTable[] }

    const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : []

    const standings = resolveGroupStandings(standingsResponse.standings ?? [], matches)

    return buildKnockoutBracket(standings, matches)
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadKnockout, [])

  return {
    bracket: data ?? null,
    isLoading,
    error,
    isEmpty: !isLoading && !error && (data?.rounds.length ?? 0) === 0,
    reload,
  }
}
