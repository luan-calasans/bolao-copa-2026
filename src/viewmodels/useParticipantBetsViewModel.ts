import { useCallback, useMemo, useState } from 'react'
import type { MatchBetEntry } from '../models/matchBet'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { getAllBets } from '../services/betStorageService'
import { fetchChampionBets } from '../services/championBetService'
import { deleteParticipantBetByReceiptId } from '../services/participantBetService'
import { fetchRanking, type RankingRow } from '../services/rankingService'
import { fetchWorldCupMatches } from '../services/matchService'
import {
  buildChampionBetMatchGroup,
  buildChampionBetTableItem,
  findChampionBetForPerson,
} from '../utils/championBetRanking'
import { computeHitRateEfficiency } from '../utils/betEfficiency'
import { computeBetsListStats } from '../utils/betsListStats'
import { getFriendlyErrorMessage, type LoadError } from '../utils/errorMessages'
import { showToast } from '../lib/toast'
import { buildBetsMatchGroups, type BetsMatchGroup } from '../utils/matchBetRows'
import { filterBetsByPersonNameKey } from '../utils/participantBets'
import { formatPersonNameKeyDisplay } from '../utils/participantDisplay'
import {
  canParticipantDeleteBetItem,
  getParticipantDeleteBlockedMessage,
} from '../utils/participantBetDeletion'

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
  deletingReceiptId?: string | null
  removeBet?: (receiptId: string) => Promise<void>
}

export interface UseParticipantBetsViewModelOptions {
  allowDelete?: boolean
}

export function useParticipantBetsViewModel(
  personNameKey: string,
  options?: UseParticipantBetsViewModelOptions,
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

  const { data, isLoading, error, reload, setData } = useAsyncResource(loadData, [personNameKey])
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null)

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
        const { totalBets, totalExact, totalPartial, totalMissed } = computeBetsListStats(
          groups,
          bets,
        )
        const hitRateEfficiency = computeHitRateEfficiency(totalExact, totalPartial, totalMissed)

        return {
          ...current,
          bets,
          groups,
          totalBets,
          totalExact,
          totalPartial,
          totalMissed,
          hitRateEfficiency,
        }
      })
    },
    [setData],
  )

  const removeBet = useCallback(
    async (receiptId: string) => {
      const betItem = data?.groups
        .flatMap((group) =>
          group.rows.map((row) => ({
            matchId: group.matchId,
            match: group.match,
            row,
            championTeam: group.championTeam,
          })),
        )
        .find((item) => item.row.entry.receiptId === receiptId)

      if (betItem && !canParticipantDeleteBetItem(betItem)) {
        showToast(getParticipantDeleteBlockedMessage(betItem), 'error')
        return
      }

      setDeletingReceiptId(receiptId)

      try {
        await deleteParticipantBetByReceiptId(receiptId)
        removeBetLocally(receiptId)
        showToast('Palpite excluído.')
      } catch (err) {
        showToast(getFriendlyErrorMessage(err), 'error')
        throw err
      } finally {
        setDeletingReceiptId(null)
      }
    },
    [data?.groups, removeBetLocally],
  )

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
    ...(options?.allowDelete ? { deletingReceiptId, removeBet } : {}),
  }
}
