import type { Match } from './match'
import type { WinnerPick } from './winnerPick'

export interface Bet {
  matchId: number
  homeScore?: number | null
  awayScore?: number | null
  winnerPick?: WinnerPick
  personName?: string
  match?: Match
  createdAt: string
  updatedAt?: string | null
}
