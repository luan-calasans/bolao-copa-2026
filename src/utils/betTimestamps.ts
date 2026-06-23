import type { MatchBetEntry } from '../models/matchBet'

export function getBetActivityTimestamp(
  entry: Pick<MatchBetEntry, 'updatedAt' | 'generatedAt' | 'createdAt'>,
): string {
  return entry.updatedAt ?? entry.generatedAt ?? entry.createdAt
}
