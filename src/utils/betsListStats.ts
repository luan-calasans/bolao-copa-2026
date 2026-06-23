import type { MatchBetEntry } from '../models/matchBet'
import type { BetsMatchGroup } from '../utils/matchBetRows'

export function computeBetsListStats(groups: BetsMatchGroup[], _bets: MatchBetEntry[]) {
  return {
    totalBets: groups.reduce((sum, group) => sum + group.rows.length, 0),
    totalExact: groups.reduce((sum, group) => sum + group.exactCount, 0),
    totalPartial: groups.reduce((sum, group) => sum + group.partialCount, 0),
    totalMissed: groups.reduce(
      (sum, group) => sum + group.rows.filter((row) => row.resultStatus === 'none').length,
      0,
    ),
  }
}
