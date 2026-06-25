import { useCallback, useMemo } from 'react'
import type { ApiStandingTable } from '../models/api.types'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchWorldCupStandings } from '../services/competitionService'
import { fetchWorldCupMatches } from '../services/matchService'
import { resolveGroupStandings } from '../utils/standingsBuilder'
import { buildThirdPlaceRanking, type ThirdPlaceRankingEntry } from '../utils/thirdPlaceRanking'

interface StandingsData {
  standings: ApiStandingTable[]
  thirdPlaceRanking: ThirdPlaceRankingEntry[]
}

export function useStandingsViewModel() {
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
    const standings = resolveGroupStandings(response.standings ?? [], matches)

    return {
      standings,
      thirdPlaceRanking: buildThirdPlaceRanking(standings),
    }
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadStandings, [])

  const standings = useMemo(() => data?.standings ?? [], [data?.standings])
  const thirdPlaceRanking = useMemo(
    () => data?.thirdPlaceRanking ?? [],
    [data?.thirdPlaceRanking],
  )
  const isEmpty = !isLoading && !error && standings.length === 0

  return {
    standings,
    thirdPlaceRanking,
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
