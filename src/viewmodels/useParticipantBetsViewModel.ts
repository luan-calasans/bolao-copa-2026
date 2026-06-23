import { useCallback, useMemo } from 'react'
import type { MatchBetEntry } from '../models/matchBet'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { getAllBets } from '../services/betStorageService'
import { fetchChampionBets } from '../services/championBetService'
import { fetchRanking, type RankingRow } from '../services/rankingService'
import { fetchWorldCupMatches } from '../services/matchService'
import {
  buildChampionBetMatchGroup,
  buildChampionBetTableItem,
  findChampionBetForPerson,
} from '../utils/championBetRanking'
import { computeHitRateEfficiency } from '../utils/betEfficiency'
import { computeBetsListStats } from '../utils/betsListStats'
import type { LoadError } from '../utils/errorMessages'
import { buildBetsMatchGroups, type BetsMatchGroup } from '../utils/matchBetRows'
import { filterBetsByPersonNameKey } from '../utils/participantBets'
import { formatPersonNameKeyDisplay } from '../utils/participantDisplay'

interface ParticipantBetsData {
  groups: BetsMatchGroup[]
  bets: MatchBetEntry[]
  displayName: string
  rankingRow: RankingRow | null
  rankingPosition: number | null
  totalBets: number
  totalExact: number
  totalPartial: number
  totalMissed: number
  hitRateEfficiency: number | null
}

export interface ParticipantBetsViewModelState {
  groups: BetsMatchGroup[]
  displayName: string
  rankingRow: RankingRow | null
  rankingPosition: number | null
  totalBets: number
  totalExact: number
  totalPartial: number
  totalMissed: number
  hitRateEfficiency: number | null
  isLoading: boolean
  error: LoadError | null
  isEmpty: boolean
  reload: (force?: boolean) => void
}

export function useParticipantBetsViewModel(
  personNameKey: string,
): ParticipantBetsViewModelState {
  const loadData = useCallback(
    async (): Promise<ParticipantBetsData> => {
      const [loadedBets, matches, rankingResponse, championResponse] = await Promise.all([
        getAllBets(),
        fetchWorldCupMatches(),
        fetchRanking().catch(() => null),
        fetchChampionBets(),
      ])

      const matchesById = new Map(matches.map((match) => [match.id, match]))
      const bets = filterBetsByPersonNameKey(loadedBets, personNameKey)
      const matchGroups = buildBetsMatchGroups(bets, matchesById)
      const championBet = findChampionBetForPerson(championResponse.bets, personNameKey)
      const championGroup = championBet
        ? buildChampionBetMatchGroup(
            buildChampionBetTableItem(championBet, championResponse.meta.finalMatch),
          )
        : null
      const groups = championGroup ? [...matchGroups, championGroup] : matchGroups
      const { totalBets, totalExact, totalPartial, totalMissed } = computeBetsListStats(
        groups,
        bets,
      )
      const hitRateEfficiency =
        rankingResponse?.ranking.find((row) => row.personNameKey === personNameKey)
          ?.hitRateEfficiency ??
        computeHitRateEfficiency(totalExact, totalPartial, totalMissed)
      const rankingRow =
        rankingResponse?.ranking.find((row) => row.personNameKey === personNameKey) ?? null
      const rankingIndex =
        rankingResponse?.ranking.findIndex((row) => row.personNameKey === personNameKey) ?? -1
      const rankingPosition = rankingIndex >= 0 ? rankingIndex + 1 : null
      const displayName =
        rankingRow?.displayName ?? bets[0]?.personName?.trim() ?? personNameKey

      return {
        groups,
        bets,
        displayName,
        rankingRow,
        rankingPosition,
        totalBets,
        totalExact,
        totalPartial,
        totalMissed,
        hitRateEfficiency,
      }
    },
    [personNameKey],
  )

  const { data, isLoading, error, reload } = useAsyncResource(loadData, [personNameKey])

  const groups = useMemo(() => data?.groups ?? [], [data?.groups])
  const displayName = data?.displayName ?? formatPersonNameKeyDisplay(personNameKey)
  const rankingRow = data?.rankingRow ?? null
  const rankingPosition = data?.rankingPosition ?? null
  const totalBets = data?.totalBets ?? 0
  const totalExact = data?.totalExact ?? 0
  const totalPartial = data?.totalPartial ?? 0
  const totalMissed = data?.totalMissed ?? 0
  const hitRateEfficiency =
    data?.hitRateEfficiency ??
    computeHitRateEfficiency(totalExact, totalPartial, totalMissed)
  const isEmpty = !isLoading && !error && totalBets === 0

  return {
    groups,
    displayName,
    rankingRow,
    rankingPosition,
    totalBets,
    totalExact,
    totalPartial,
    totalMissed,
    hitRateEfficiency,
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
