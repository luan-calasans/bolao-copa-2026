import { useCallback, useMemo } from 'react'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchHistoricalTournament } from '../services/historicalWorldCupService'
import {
  buildHistoricalFinalRoundBracket,
  buildHistoricalKnockoutBracket,
  hasKnockoutMatches,
  supportsDesktopKnockoutLayout,
} from '../utils/historicalKnockoutMapper'
import {
  buildHistoricalScorers,
  buildHistoricalTeamGoals,
  buildStandingsFromMatches,
  mapHistoricalStandings,
} from '../utils/historicalScorers'

export function useHistoricoYearViewModel(year: number) {
  const loadFn = useCallback(() => fetchHistoricalTournament(year), [year])

  const { data, isLoading, error, reload } = useAsyncResource(loadFn, [year])

  const bracket = useMemo(() => {
    if (!data) return null

    const knockout = buildHistoricalKnockoutBracket(data.matches)
    if (knockout.rounds.length > 0) {
      return knockout
    }

    return buildHistoricalFinalRoundBracket(data.matches)
  }, [data])

  const standings = useMemo(() => {
    if (!data) return []

    if (data.standings) {
      return mapHistoricalStandings(data.standings)
    }

    return buildStandingsFromMatches(data.matches, data.teams)
  }, [data])

  const scorers = useMemo(() => (data ? buildHistoricalScorers(data.matches) : []), [data])
  const teamGoals = useMemo(() => (data ? buildHistoricalTeamGoals(data.matches) : []), [data])

  const showKnockout = data
    ? hasKnockoutMatches(data.matches) || buildHistoricalFinalRoundBracket(data.matches) != null
    : false
  const showDesktopKnockout = bracket ? supportsDesktopKnockoutLayout(bracket.rounds) : false

  const isEmpty = useMemo(() => !isLoading && !error && data == null, [data, error, isLoading])

  return {
    tournament: data,
    bracket,
    standings,
    scorers,
    teamGoals,
    showKnockout,
    showDesktopKnockout,
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
