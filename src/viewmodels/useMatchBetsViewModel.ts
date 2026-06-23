import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Match } from '../models/match'
import type { MatchBetEntry } from '../models/matchBet'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { getBetsByMatchId } from '../services/betStorageService'
import {
  fetchMatchById,
  fetchWorldCupMatchesBundle,
  findWorldCupMatchById,
} from '../services/matchService'
import { buildMatchBetRows, type MatchBetRow } from '../utils/matchBetRows'
import {
  buildMatchGroupStandingsPreview,
  type MatchGroupStandingsPreview,
} from '../utils/matchGroupStandings'

export type { MatchBetRow }

const MATCH_REFRESH_MS = 60_000

interface MatchBetsData {
  match: Match
  bets: MatchBetEntry[]
  allMatches: Match[]
}

export function useMatchBetsViewModel(matchId: number) {
  const loadData = useCallback(
    async (forceRefresh = false): Promise<MatchBetsData> => {
      const options = forceRefresh ? { force: true as const } : undefined
      const [bundle, loadedBets] = await Promise.all([
        fetchWorldCupMatchesBundle(options),
        getBetsByMatchId(matchId, options),
      ])

      const loadedMatch =
        findWorldCupMatchById(matchId, bundle) ?? (await fetchMatchById(matchId, options))

      if (!loadedMatch) {
        throw new Error('Jogo não encontrado.')
      }

      return {
        match: loadedMatch,
        bets: loadedBets,
        allMatches: bundle.matches,
      }
    },
    [matchId],
  )

  const { data, isLoading, error, reload: reloadResource, setData } = useAsyncResource(
    loadData,
    [matchId],
  )
  const [isReloading, setIsReloading] = useState(false)

  const silentReload = useCallback(async () => {
    setIsReloading(true)

    try {
      const result = await loadData(true)
      setData(result)
    } catch {
      // Mantém dados atuais em refresh silencioso.
    } finally {
      setIsReloading(false)
    }
  }, [loadData, setData])

  useEffect(() => {
    if (isLoading || error || !data?.match) {
      return
    }

    const intervalId = window.setInterval(() => {
      void silentReload()
    }, MATCH_REFRESH_MS)

    return () => window.clearInterval(intervalId)
  }, [isLoading, error, data?.match, silentReload])

  const reload = useCallback(
    (options?: { force?: boolean; silent?: boolean }) => {
      if (options?.silent) {
        void silentReload()
        return
      }

      reloadResource(options?.force ?? false)
    },
    [reloadResource, silentReload],
  )

  const match = data?.match ?? null

  const rows = useMemo<MatchBetRow[]>(() => {
    if (!match) return []
    return buildMatchBetRows(match, data?.bets ?? [])
  }, [data?.bets, match])

  const groupStandings = useMemo<MatchGroupStandingsPreview | null>(() => {
    if (!match) return null
    return buildMatchGroupStandingsPreview(data?.allMatches ?? [], match)
  }, [data?.allMatches, match])

  const isEmpty = !isLoading && !error && rows.length === 0
  const isFinished =
    match?.status === 'finished' && match.score.home !== null && match.score.away !== null

  const exactCount = rows.filter((row) => row.resultStatus === 'exact').length
  const partialCount = rows.filter((row) => row.resultStatus === 'partial').length

  return {
    match,
    rows,
    groupStandings,
    isLoading,
    isReloading,
    error,
    isEmpty,
    isFinished,
    exactCount,
    partialCount,
    reload,
  }
}
