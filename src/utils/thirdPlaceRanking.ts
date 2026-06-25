import type { ApiStandingRow, ApiStandingTable } from '../models/api.types'
import type { GroupCode } from './knockoutBracketTemplate'
import {
  buildGroupSnapshots,
  getQualifiedThirdGroups,
  rankThirdPlaceTeams,
} from './knockoutQualifiers'

export interface ThirdPlaceRankingEntry {
  rank: number
  group: GroupCode
  row: ApiStandingRow
  isQualified: boolean
}

export function buildThirdPlaceRanking(standings: ApiStandingTable[]): ThirdPlaceRankingEntry[] {
  const snapshots = buildGroupSnapshots(standings)
  const ranked = rankThirdPlaceTeams(snapshots)
  const qualifiedGroups = getQualifiedThirdGroups(snapshots)

  return ranked.map((row, index) => {
    const snapshot = snapshots.find((entry) => entry.third?.team.id === row.team.id)
    const group = snapshot?.group ?? 'A'

    return {
      rank: index + 1,
      group,
      row,
      isQualified: qualifiedGroups.has(group),
    }
  })
}
