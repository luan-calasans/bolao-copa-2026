import type { Match } from '../models/match'
import type { WinnerPick } from '../models/winnerPick'
import {
  getBetScore as getBetScoreShared,
  PARTIAL_MAX_GOAL_DIFFERENCE,
  SCORING_RULES as SCORING_RULES_SHARED,
} from '../../shared/betScoring.js'

export type BetScoreType = 'exact' | 'partial' | 'none' | 'pending'

export interface BetScoreResult {
  points: number
  scoreType: BetScoreType
  winnerPoints: number
  homeTeamPoints: number
  awayTeamPoints: number
}

export type { ScoringRule, ScoringRuleGroup, ScoringRuleItem } from '../../shared/betScoring.js'

export const SCORING_RULES = SCORING_RULES_SHARED as import('../../shared/betScoring.js').ScoringRule[]
export { PARTIAL_MAX_GOAL_DIFFERENCE }

export function getBetScore(
  match: Pick<Match, 'status' | 'score'>,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  winnerPick?: WinnerPick | null,
): BetScoreResult {
  return getBetScoreShared(match, homeScore, awayScore, winnerPick)
}
