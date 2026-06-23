import type { MatchBetEntry } from '../models/matchBet'
import { normalizePersonNameKey } from './participantKey'

export function filterBetsByPersonNameKey(
  bets: MatchBetEntry[],
  personNameKey: string,
): MatchBetEntry[] {
  return bets.filter((bet) => normalizePersonNameKey(bet.personName) === personNameKey)
}
