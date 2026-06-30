import type { Team } from './team'

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | 'other'

export interface MatchScore {
  home: number | null
  away: number | null
}

export type MatchWinner = 'home' | 'away' | 'draw'

export interface Match {
  id: number
  utcDate: string
  status: MatchStatus
  rawStatus: string
  minute: number | null
  venue: string | null
  matchday: number | null
  stage: string
  group: string | null
  homeTeam: Team
  awayTeam: Team
  score: MatchScore
  halfTimeScore: MatchScore
  penalties?: MatchScore | null
  extraTime?: MatchScore | null
  winner?: MatchWinner | null
  isLive: boolean
  lastUpdated?: string | null
}

export interface MatchGroups {
  live: Match[]
  upcoming: Match[]
  finished: Match[]
  undefined: Match[]
}
