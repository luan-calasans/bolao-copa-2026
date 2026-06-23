import { describe, expect, it } from 'vitest'
import type { RankingRow } from '../services/rankingService'
import {
  DEFAULT_RANKING_TABLE_SORT,
  isDefaultRankingTableSort,
  sortRankingRows,
  toggleRankingTableSort,
} from './rankingTableSort'

function row(overrides: Partial<RankingRow> = {}): RankingRow {
  return {
    personNameKey: 'alice',
    displayName: 'Alice',
    totalPoints: 10,
    exactHits: 2,
    partialHits: 1,
    missedHits: 0,
    pendingBets: 0,
    totalBets: 3,
    hitRateEfficiency: 0.75,
    ...overrides,
  }
}

describe('rankingTableSort', () => {
  it('sorts by points descending by default', () => {
    const rows = [
      row({ personNameKey: 'a', displayName: 'A', totalPoints: 5 }),
      row({ personNameKey: 'b', displayName: 'B', totalPoints: 12 }),
    ]

    expect(sortRankingRows(rows, null).map((item) => item.displayName)).toEqual(['B', 'A'])
  })

  it('sorts participants alphabetically', () => {
    const rows = [
      row({ personNameKey: 'z', displayName: 'Zeca', totalPoints: 10 }),
      row({ personNameKey: 'a', displayName: 'Ana', totalPoints: 10 }),
    ]

    const sorted = sortRankingRows(rows, { column: 'participant', direction: 'asc' })
    expect(sorted.map((item) => item.displayName)).toEqual(['Ana', 'Zeca'])
  })

  it('places null efficiency values last when sorting descending', () => {
    const rows = [
      row({ personNameKey: 'a', displayName: 'A', hitRateEfficiency: 0.5 }),
      row({ personNameKey: 'b', displayName: 'B', hitRateEfficiency: null }),
      row({ personNameKey: 'c', displayName: 'C', hitRateEfficiency: 0.9 }),
    ]

    const sorted = sortRankingRows(rows, { column: 'efficiency', direction: 'desc' })
    expect(sorted.map((item) => item.displayName)).toEqual(['C', 'A', 'B'])
  })

  it('toggles sort direction and resets to default', () => {
    expect(toggleRankingTableSort(null, 'exact')).toEqual({
      column: 'exact',
      direction: 'desc',
    })

    expect(
      toggleRankingTableSort({ column: 'exact', direction: 'desc' }, 'exact'),
    ).toEqual({
      column: 'exact',
      direction: 'asc',
    })

    expect(
      toggleRankingTableSort({ column: 'exact', direction: 'asc' }, 'exact'),
    ).toBeNull()

    expect(isDefaultRankingTableSort(DEFAULT_RANKING_TABLE_SORT)).toBe(true)
    expect(isDefaultRankingTableSort({ column: 'exact', direction: 'desc' })).toBe(false)
  })
})
