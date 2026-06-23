import type { WinnerPick } from './winnerPick'

export interface MatchBetEntry {
  receiptId: string
  matchId: number
  homeScore?: number | null
  awayScore?: number | null
  winnerPick?: WinnerPick
  personName?: string
  createdAt: string
  generatedAt: string
  updatedAt?: string | null
}
