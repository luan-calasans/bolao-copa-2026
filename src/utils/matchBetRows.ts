import type { Match } from '../models/match'
import type { MatchBetEntry } from '../models/matchBet'
import type { ApiTeamDetail } from '../models/api.types'
import { getBetResultStatus, type BetResultStatus } from './betResult'
import { getBetScore } from './betScoring'

export interface MatchBetRow {
  entry: MatchBetEntry
  displayName: string
  resultStatus: BetResultStatus
  points: number | null
}

function countResultStatus(rows: MatchBetRow[], status: BetResultStatus): number {
  return rows.filter((row) => row.resultStatus === status).length
}

export function buildMatchBetRows(match: Match, bets: MatchBetEntry[]): MatchBetRow[] {
  return bets.map((entry) => {
    const resultStatus = getBetResultStatus(
      match,
      entry.homeScore,
      entry.awayScore,
      entry.winnerPick,
    )
    const points =
      resultStatus === 'pending'
        ? null
        : getBetScore(match, entry.homeScore, entry.awayScore, entry.winnerPick).points

    return {
      entry,
      displayName: entry.personName?.trim() || 'Sem nome',
      resultStatus,
      points,
    }
  })
}

export function groupBetsByMatchId(bets: MatchBetEntry[]): Map<number, MatchBetEntry[]> {
  const groups = new Map<number, MatchBetEntry[]>()

  for (const bet of bets) {
    const current = groups.get(bet.matchId) ?? []
    current.push(bet)
    groups.set(bet.matchId, current)
  }

  return groups
}

export interface BetsMatchGroup {
  matchId: number
  match: Match | null
  rows: MatchBetRow[]
  exactCount: number
  partialCount: number
  championTeam?: ApiTeamDetail
}

export function buildBetsMatchGroups(
  bets: MatchBetEntry[],
  matchesById: Map<number, Match>,
): BetsMatchGroup[] {
  const grouped = groupBetsByMatchId(bets)

  return Array.from(grouped.entries())
    .map(([matchId, entries]) => {
      const match = matchesById.get(matchId) ?? null
      const rows = match
        ? buildMatchBetRows(match, entries)
        : entries.map((entry) => ({
            entry,
            displayName: entry.personName?.trim() || 'Sem nome',
            resultStatus: 'pending' as const,
            points: null,
          }))

      return {
        matchId,
        match,
        rows,
        exactCount: countResultStatus(rows, 'exact'),
        partialCount: countResultStatus(rows, 'partial'),
      }
    })
    .sort((a, b) => {
      const aDate = a.match?.utcDate ?? a.rows[0]?.entry.createdAt ?? ''
      const bDate = b.match?.utcDate ?? b.rows[0]?.entry.createdAt ?? ''
      return aDate.localeCompare(bDate)
    })
}
