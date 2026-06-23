import type { BetsTableItem } from '../models/betsTable'
import type { RankingRow } from '../services/rankingService'
import type { MatchBetEntry } from '../models/matchBet'
import { getAllBets } from '../services/betStorageService'
import { fetchChampionBets } from '../services/championBetService'
import { fetchWorldCupMatches } from '../services/matchService'
import { normalizePersonNameKey } from './participantKey'
import { buildBetsMatchGroups } from './matchBetRows'
import { getTeamDisplayName } from './teamDisplay'
import { PARTIAL_MAX_GOAL_DIFFERENCE } from './betScoring'
import { buildChampionBetTableItem, formatChampionBetStatLabel } from './championBetRanking'
import {
  getParticipantBetItemsCache,
  getParticipantBetItemsPromise,
  invalidateParticipantBetItemsCache,
  setParticipantBetItemsCache,
  setParticipantBetItemsPromise,
} from './participantBetItemsCache'

export { invalidateParticipantBetItemsCache }

export type RankingStatKind = 'points' | 'exact' | 'partial' | 'bets' | 'pending'

export interface RankingStatSelection {
  personNameKey: string
  displayName: string
  kind: RankingStatKind
  value: number
}

export const RANKING_STAT_LABELS: Record<RankingStatKind, string> = {
  points: 'Pontos',
  exact: 'Exatos',
  partial: 'Parciais',
  bets: 'Palpites',
  pending: 'Aguardando',
}

export const RANKING_STAT_DESCRIPTIONS: Record<RankingStatKind, string> = {
  points:
    'Detalhamento de cada palpite em jogo encerrado, com o que foi acertado e a pontuação obtida.',
  exact: 'Palpites em que o placar completo foi acertado (+10 pts, ou mais com Quem vence?).',
  partial:
    `Palpites que acertaram quem venceu ou o empate pelo placar previsto, com diferença total de no máximo ${PARTIAL_MAX_GOAL_DIFFERENCE} gols entre palpite e resultado (+3 pts, ou mais com Quem vence?).`,
  bets: 'Todos os palpites registrados por este participante, incluindo o palpite de campeão.',
  pending: 'Palpites em jogos que ainda não terminaram, incluindo o palpite de campeão enquanto a final não encerra.',
}

function buildBetItemsFromEntries(
  bets: MatchBetEntry[],
  matchesById: Map<number, import('../models/match').Match>,
): BetsTableItem[] {
  const groups = buildBetsMatchGroups(bets, matchesById)

  return groups.flatMap((group) =>
    group.rows.map((row) => ({
      matchId: group.matchId,
      match: group.match,
      row,
    })),
  )
}

export async function loadParticipantBetItemsMap(): Promise<Map<string, BetsTableItem[]>> {
  const cached = getParticipantBetItemsCache()
  if (cached) {
    return cached
  }

  let promise = getParticipantBetItemsPromise()
  if (!promise) {
    promise = (async () => {
      const [bets, matches, championResponse] = await Promise.all([
        getAllBets(),
        fetchWorldCupMatches(),
        fetchChampionBets(),
      ])
      const matchesById = new Map(matches.map((match) => [match.id, match]))
      const betsByPerson = new Map<string, MatchBetEntry[]>()

      for (const bet of bets) {
        const key = normalizePersonNameKey(bet.personName)
        if (!key) continue

        const current = betsByPerson.get(key) ?? []
        current.push(bet)
        betsByPerson.set(key, current)
      }

      const result = new Map<string, BetsTableItem[]>()

      for (const [personNameKey, personBets] of betsByPerson) {
        result.set(personNameKey, buildBetItemsFromEntries(personBets, matchesById))
      }

      for (const championBet of championResponse.bets) {
        const key = normalizePersonNameKey(championBet.personName)
        if (!key) continue

        const championItem = buildChampionBetTableItem(
          championBet,
          championResponse.meta.finalMatch,
        )
        const current = result.get(key) ?? []
        current.push(championItem)
        result.set(key, current)
      }

      setParticipantBetItemsCache(result)
      return result
    })().finally(() => {
      setParticipantBetItemsPromise(null)
    })

    setParticipantBetItemsPromise(promise)
  }

  return promise
}

export function getParticipantBetItems(
  itemsByPerson: Map<string, BetsTableItem[]>,
  personNameKey: string,
): BetsTableItem[] {
  return itemsByPerson.get(personNameKey) ?? []
}

export function filterRankingStatItems(
  items: BetsTableItem[],
  kind: RankingStatKind,
): BetsTableItem[] {
  switch (kind) {
    case 'points':
      return items.filter((item) => item.row.resultStatus !== 'pending')
    case 'exact':
      return items.filter((item) => item.row.resultStatus === 'exact')
    case 'partial':
      return items.filter((item) => item.row.resultStatus === 'partial')
    case 'bets':
      return items
    case 'pending':
      return items.filter((item) => item.row.resultStatus === 'pending')
  }
}

export function sortRankingStatItems(
  items: BetsTableItem[],
  kind: RankingStatKind,
): BetsTableItem[] {
  const sorted = [...items]

  sorted.sort((a, b) => {
    if (kind === 'points') {
      const pointsDiff = (b.row.points ?? 0) - (a.row.points ?? 0)
      if (pointsDiff !== 0) return pointsDiff
    }

    const dateA = a.match?.utcDate ?? a.row.entry.createdAt ?? ''
    const dateB = b.match?.utcDate ?? b.row.entry.createdAt ?? ''
    return dateB.localeCompare(dateA, 'pt-BR')
  })

  return sorted
}

export function formatRankingStatMatchLabel(item: BetsTableItem): string {
  if (item.championTeam) {
    return formatChampionBetStatLabel(item.championTeam)
  }

  const { match, matchId } = item

  if (!match) {
    return `Jogo #${matchId ?? item.row.entry.matchId}`
  }

  return `${getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)} x ${getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)}`
}

export function isRankingStatClickable(
  kind: RankingStatKind,
  value: number,
  row?: Pick<RankingRow, 'totalBets' | 'pendingBets'>,
): boolean {
  if (kind === 'points' && row) {
    return value > 0 || row.totalBets - row.pendingBets > 0
  }

  if (value <= 0) return false
  return true
}
