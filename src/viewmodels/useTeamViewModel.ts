import { useCallback, useMemo } from 'react'
import type { ApiTeamDetail } from '../models/api.types'
import type { Match } from '../models/match'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchTeamById, fetchTeamMatchesMapped } from '../services/teamService'
import type { LoadError } from '../utils/errorMessages'
import { sortTeamMatches } from '../utils/matchMapper'

interface TeamViewData {
  team: ApiTeamDetail
  matches: Match[]
}

export interface TeamViewModelState {
  team: ApiTeamDetail | null
  matches: Match[]
  isLoading: boolean
  error: LoadError | null
  isEmpty: boolean
  reload: (force?: boolean) => void
}

export function useTeamViewModel(teamId: number): TeamViewModelState {
  const loadData = useCallback(async (): Promise<TeamViewData> => {
    const [teamData, teamMatches] = await Promise.all([
      fetchTeamById(teamId),
      fetchTeamMatchesMapped(teamId),
    ])

    return { team: teamData, matches: teamMatches }
  }, [teamId])

  const { data, isLoading, error, reload } = useAsyncResource(loadData, [teamId])

  const team = data?.team ?? null

  const matches = useMemo(() => sortTeamMatches(data?.matches ?? []), [data?.matches])
  const isEmpty = !isLoading && !error && matches.length === 0

  return {
    team,
    matches,
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
