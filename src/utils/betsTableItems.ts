import type { BetsTableItem } from '../models/betsTable'
import type { BetsMatchGroup } from './matchBetRows'

export function buildBetsTableItems(groups: BetsMatchGroup[]): BetsTableItem[] {
  return groups.flatMap((group) =>
    group.rows.map((row) => ({
      matchId: group.matchId,
      match: group.match,
      row,
      championTeam: group.championTeam,
    })),
  )
}
