import type { WinnerPick } from './winnerPick.js'

export type BetScoreType = 'exact' | 'partial' | 'none' | 'pending'

export interface BetScoreMatch {
  status: string
  score: {
    home: number | null
    away: number | null
  }
}

export interface BetScoreResult {
  points: number
  scoreType: BetScoreType
  winnerPoints: number
  homeTeamPoints: number
  awayTeamPoints: number
  actualHomeScore: number | null
  actualAwayScore: number | null
}

export interface ScoringRuleItem {
  title: string
  points: string
  description: string
}

export interface ScoringRuleGroup {
  title: string
  items: ScoringRuleItem[]
}

export type ScoringRule = ScoringRuleItem | ScoringRuleGroup

export function getBetScore(
  match: BetScoreMatch,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  winnerPick?: WinnerPick | null,
): BetScoreResult

export const PARTIAL_MAX_GOAL_DIFFERENCE: number

export const SCORING_RULES: ScoringRule[]
