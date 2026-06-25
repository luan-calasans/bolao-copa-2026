import { useCallback, useMemo } from 'react'
import type { ApiScorer } from '../models/api.types'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchWorldCupScorers } from '../services/competitionService'
import { fetchWorldCupMatches } from '../services/matchService'
import { buildTeamGoalsFromMatches, type TeamGoalsEntry } from '../utils/teamGoalsFromMatches'

interface ScorersData {
  scorers: ApiScorer[]
  teamGoals: TeamGoalsEntry[]
}

export function useScorersViewModel() {
  const loadScorers = useCallback(async (forceRefresh = false): Promise<ScorersData> => {
    const options = forceRefresh ? { force: true as const } : undefined
    const [scorersResponse, matches] = await Promise.all([
      fetchWorldCupScorers(undefined, options),
      fetchWorldCupMatches(options),
    ])

    return {
      scorers: scorersResponse.scorers ?? [],
      teamGoals: buildTeamGoalsFromMatches(matches),
    }
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadScorers, [])

  const scorers = useMemo(() => data?.scorers ?? [], [data?.scorers])
  const teamGoals = useMemo(() => data?.teamGoals ?? [], [data?.teamGoals])
  const isEmpty = !isLoading && !error && scorers.length === 0 && teamGoals.length === 0

  return {
    scorers,
    teamGoals,
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
