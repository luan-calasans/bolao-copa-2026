import { useCallback, useMemo } from 'react'
import type { Match } from '../models/match'
import type { MatchBetEntry } from '../models/matchBet'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchChampionBets } from '../services/championBetService'
import { fetchWorldCupMatches } from '../services/matchService'
import { buildChampionBetMatchGroups } from '../utils/championBetRanking'
import { computeBetsListStats } from '../utils/betsListStats'
import type { LoadError } from '../utils/errorMessages'
import { buildBetsMatchGroups, type BetsMatchGroup } from '../utils/matchBetRows'

export type { BetsMatchGroup }

interface BetsListData {
  bets: MatchBetEntry[]
  matchesById: Map<number, Match>
  groups: BetsMatchGroup[]
}

export interface BetsListViewModelState {
  groups: BetsMatchGroup[]
  totalBets: number
  totalExact: number
  totalPartial: number
  totalMissed: number
  isLoading: boolean
  error: LoadError | null
  isEmpty: boolean
  reload: (force?: boolean) => void
  removeBetLocally: (receiptId: string) => void
}

export interface UseBetsListViewModelOptions {
  fetchBets: () => Promise<MatchBetEntry[]>
  includeChampionBets?: boolean
}

export function useBetsListViewModel({
  fetchBets,
  includeChampionBets = false,
}: UseBetsListViewModelOptions): BetsListViewModelState {
  const loadData = useCallback(
    async (): Promise<BetsListData> => {
      const [loadedBets, matches, championResponse] = await Promise.all([
        fetchBets(),
        fetchWorldCupMatches(),
        includeChampionBets ? fetchChampionBets() : Promise.resolve(null),
      ])

      const matchesById = new Map(matches.map((match) => [match.id, match]))
      const matchGroups = buildBetsMatchGroups(loadedBets, matchesById)
      const championGroups = championResponse
        ? buildChampionBetMatchGroups(
            championResponse.bets,
            championResponse.meta.finalMatch,
          )
        : []
      const groups = championGroups.length > 0 ? [...matchGroups, ...championGroups] : matchGroups

      return {
        bets: loadedBets,
        matchesById,
        groups,
      }
    },
    [fetchBets, includeChampionBets],
  )

  const { data, isLoading, error, reload, setData } = useAsyncResource(loadData, [
    fetchBets,
    includeChampionBets,
  ])

  const bets = useMemo(() => data?.bets ?? [], [data?.bets])
  const groups = useMemo(() => data?.groups ?? [], [data?.groups])

  const { totalBets, totalExact, totalPartial, totalMissed } = useMemo(
    () => computeBetsListStats(groups, bets),
    [groups, bets],
  )

  const removeBetLocally = useCallback(
    (receiptId: string) => {
      setData((current) => {
        if (!current) return current

        const bets = current.bets.filter((entry) => entry.receiptId !== receiptId)
        const groups = current.groups
          .map((group) => ({
            ...group,
            rows: group.rows.filter((row) => row.entry.receiptId !== receiptId),
          }))
          .filter((group) => group.rows.length > 0)

        return { ...current, bets, groups }
      })
    },
    [setData],
  )

  const isEmpty = !isLoading && !error && totalBets === 0

  return {
    groups,
    totalBets,
    totalExact,
    totalPartial,
    totalMissed,
    isLoading,
    error,
    isEmpty,
    reload,
    removeBetLocally,
  }
}
