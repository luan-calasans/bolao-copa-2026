import type { RankingRow } from '../services/rankingService'

export type RankingTableSortColumn =
  | 'participant'
  | 'points'
  | 'exact'
  | 'partial'
  | 'efficiency'
  | 'bets'
  | 'pending'

export type RankingTableSortDirection = 'asc' | 'desc'

export interface RankingTableSortState {
  column: RankingTableSortColumn
  direction: RankingTableSortDirection
}

export const DEFAULT_RANKING_TABLE_SORT: RankingTableSortState = {
  column: 'points',
  direction: 'desc',
}

export function getDefaultRankingSortDirection(
  column: RankingTableSortColumn,
): RankingTableSortDirection {
  return column === 'participant' ? 'asc' : 'desc'
}

export function isDefaultRankingTableSort(sort: RankingTableSortState | null): boolean {
  if (!sort) return true

  return (
    sort.column === DEFAULT_RANKING_TABLE_SORT.column &&
    sort.direction === DEFAULT_RANKING_TABLE_SORT.direction
  )
}

export function toggleRankingTableSort(
  current: RankingTableSortState | null,
  column: RankingTableSortColumn,
): RankingTableSortState | null {
  const effective = current ?? DEFAULT_RANKING_TABLE_SORT

  if (effective.column !== column) {
    return { column, direction: getDefaultRankingSortDirection(column) }
  }

  const defaultDirection = getDefaultRankingSortDirection(column)

  if (effective.direction === defaultDirection) {
    return {
      column,
      direction: defaultDirection === 'asc' ? 'desc' : 'asc',
    }
  }

  return null
}

function compareStrings(a: string, b: string, direction: RankingTableSortDirection): number {
  const result = a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  return direction === 'asc' ? result : -result
}

function compareNumbers(
  a: number,
  b: number,
  direction: RankingTableSortDirection,
): number {
  const result = a - b
  return direction === 'asc' ? result : -result
}

function compareEfficiency(
  a: RankingRow,
  b: RankingRow,
  direction: RankingTableSortDirection,
): number {
  const aValue = a.hitRateEfficiency
  const bValue = b.hitRateEfficiency

  if (aValue == null && bValue == null) return 0
  if (aValue == null) return 1
  if (bValue == null) return -1

  return compareNumbers(aValue, bValue, direction)
}

function getColumnValue(row: RankingRow, column: RankingTableSortColumn): number | string {
  switch (column) {
    case 'participant':
      return row.displayName
    case 'points':
      return row.totalPoints
    case 'exact':
      return row.exactHits
    case 'partial':
      return row.partialHits
    case 'efficiency':
      return row.hitRateEfficiency ?? -1
    case 'bets':
      return row.totalBets
    case 'pending':
      return row.pendingBets
    default:
      return 0
  }
}

export function sortRankingRows(
  rows: RankingRow[],
  sort: RankingTableSortState | null,
): RankingRow[] {
  const effectiveSort = sort ?? DEFAULT_RANKING_TABLE_SORT
  const sorted = [...rows]
  const { column, direction } = effectiveSort

  sorted.sort((a, b) => {
    const primaryResult = (() => {
      switch (column) {
        case 'participant':
          return compareStrings(a.displayName, b.displayName, direction)
        case 'efficiency':
          return compareEfficiency(a, b, direction)
        case 'points':
        case 'exact':
        case 'partial':
        case 'bets':
        case 'pending':
          return compareNumbers(
            getColumnValue(a, column) as number,
            getColumnValue(b, column) as number,
            direction,
          )
        default:
          return 0
      }
    })()

    if (primaryResult !== 0) return primaryResult

    if (column !== 'points') {
      const byPoints = compareNumbers(a.totalPoints, b.totalPoints, 'desc')
      if (byPoints !== 0) return byPoints
    }

    return compareStrings(a.displayName, b.displayName, 'asc')
  })

  return sorted
}

export function getRankingTableSortHint(
  column: RankingTableSortColumn,
  direction: RankingTableSortDirection,
): string {
  const hints: Record<RankingTableSortColumn, Record<RankingTableSortDirection, string>> = {
    participant: { asc: 'A–Z', desc: 'Z–A' },
    points: { desc: 'Maior pontuação primeiro', asc: 'Menor pontuação primeiro' },
    exact: { desc: 'Mais exatos primeiro', asc: 'Menos exatos primeiro' },
    partial: { desc: 'Mais parciais primeiro', asc: 'Menos parciais primeiro' },
    efficiency: { desc: 'Maior eficiência primeiro', asc: 'Menor eficiência primeiro' },
    bets: { desc: 'Mais palpites primeiro', asc: 'Menos palpites primeiro' },
    pending: { desc: 'Mais aguardando primeiro', asc: 'Menos aguardando primeiro' },
  }

  return hints[column][direction]
}
