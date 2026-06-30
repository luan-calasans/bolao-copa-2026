import type { ApiStandingRow, ApiStandingTable } from '../models/api.types'
import type { GroupCode } from './knockoutBracketTemplate'
import { getBestThirdPlacedTeams } from './roundOf32Generator'

export interface ThirdPlaceRankingEntry {
  rank: number
  group: GroupCode
  row: ApiStandingRow
  isQualified: boolean
}

export function buildThirdPlaceRanking(standings: ApiStandingTable[]): ThirdPlaceRankingEntry[] {
  return getBestThirdPlacedTeams(standings).map(({ rank, group, row, isQualified }) => ({
    rank,
    group,
    row,
    isQualified,
  }))
}
