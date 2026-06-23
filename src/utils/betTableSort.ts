import { getBetActivityTimestamp } from './betTimestamps'
import type { BetsTableItem } from '../models/betsTable'
import { formatChampionBetStatLabel } from './championBetRanking'
import { getTeamDisplayName } from './teamDisplay'

export type BetTableSortColumn = 'matchDate' | 'match' | 'participant' | 'generatedAt' | 'result'
export type BetTableSortDirection = 'asc' | 'desc'

export interface BetTableSortState {
  column: BetTableSortColumn
  direction: BetTableSortDirection
}

export function getDefaultSortDirection(column: BetTableSortColumn): BetTableSortDirection {
  return column === 'matchDate' || column === 'generatedAt' ? 'desc' : 'asc'
}

export function toggleBetTableSort(
  current: BetTableSortState | null,
  column: BetTableSortColumn,
): BetTableSortState | null {
  if (current?.column !== column) {
    return { column, direction: getDefaultSortDirection(column) }
  }

  const defaultDirection = getDefaultSortDirection(column)

  if (current.direction === defaultDirection) {
    return {
      column,
      direction: defaultDirection === 'asc' ? 'desc' : 'asc',
    }
  }

  return null
}

function compareStrings(a: string, b: string, direction: BetTableSortDirection): number {
  const result = a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  return direction === 'asc' ? result : -result
}

function getMatchDateKey(item: BetsTableItem): string {
  return item.match?.utcDate ?? item.row.entry.createdAt ?? ''
}

function getMatchLabel(item: BetsTableItem): string {
  if (item.championTeam) {
    return formatChampionBetStatLabel(item.championTeam)
  }

  const { match, matchId } = item

  if (!match) {
    return `Jogo #${matchId ?? 0}`
  }

  const home = getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)
  const away = getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)
  return `${home} x ${away}`
}

export function sortBetsTableItems(
  items: BetsTableItem[],
  sort: BetTableSortState,
): BetsTableItem[] {
  const sorted = [...items]
  const { column, direction } = sort

  sorted.sort((a, b) => {
    switch (column) {
      case 'matchDate':
        return compareStrings(getMatchDateKey(a), getMatchDateKey(b), direction)
      case 'match':
        return compareStrings(getMatchLabel(a), getMatchLabel(b), direction)
      case 'participant':
        return compareStrings(a.row.displayName, b.row.displayName, direction)
      case 'generatedAt':
        return compareStrings(
          getBetActivityTimestamp(a.row.entry),
          getBetActivityTimestamp(b.row.entry),
          direction,
        )
      case 'result': {
        const aPoints = a.row.points ?? -1
        const bPoints = b.row.points ?? -1
        const result = aPoints - bPoints
        return direction === 'asc' ? result : -result
      }
      default:
        return 0
    }
  })

  return sorted
}

export function getBetTableSortHint(
  column: BetTableSortColumn,
  direction: BetTableSortDirection,
): string {
  const hints: Record<BetTableSortColumn, Record<BetTableSortDirection, string>> = {
    matchDate: { desc: 'Mais recente primeiro', asc: 'Mais antigo primeiro' },
    match: { asc: 'A–Z', desc: 'Z–A' },
    participant: { asc: 'A–Z', desc: 'Z–A' },
    generatedAt: { desc: 'Mais recente primeiro', asc: 'Mais antigo primeiro' },
    result: { asc: 'Menor pontuação primeiro', desc: 'Maior pontuação primeiro' },
  }

  return hints[column][direction]
}
