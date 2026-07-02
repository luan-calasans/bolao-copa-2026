import type { MatchStatus } from './match'
import type { Team } from './team'

export type KnockoutStage =
  | 'LAST_32'
  | 'LAST_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL'

export interface KnockoutParticipant {
  team: Team | null
  label: string
  isProjected: boolean
}

export interface KnockoutMatch {
  key: string
  id?: number
  matchId?: string
  matchday?: number | null
  stage: KnockoutStage
  home: KnockoutParticipant
  away: KnockoutParticipant
  score: { home: number | null; away: number | null }
  penalties?: { home: number | null; away: number | null } | null
  extraTime?: { home: number | null; away: number | null } | null
  status: MatchStatus
  utcDate: string | null
  isProjected: boolean
}

export interface KnockoutRound {
  stage: KnockoutStage
  label: string
  matches: KnockoutMatch[]
}

export interface KnockoutBracket {
  rounds: KnockoutRound[]
}
