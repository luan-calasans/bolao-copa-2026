import type { Match } from '../models/match'
import type { WinnerPick } from '../models/winnerPick'
import { PARTIAL_MAX_GOAL_DIFFERENCE } from '../../shared/betScoring.js'
import { getBetScore } from './betScoring'
import { formatWinnerPickLabel } from './winnerPickDisplay'
import { isValidWinnerPick } from './winnerPickValidation'

export type BetScoreHitTone = 'exact' | 'partial' | 'winner'

export interface BetScoreBreakdownHit {
  title: string
  description: string
  points: number
  tone: BetScoreHitTone
}

export interface BetScoreBreakdown {
  isPending: boolean
  totalPoints: number
  hits: BetScoreBreakdownHit[]
}

function formatScore(home: number, away: number): string {
  return `${home}×${away}`
}

export function buildBetScoreBreakdown(
  match: Pick<Match, 'status' | 'score' | 'homeTeam' | 'awayTeam'>,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
  winnerPick?: WinnerPick | null,
): BetScoreBreakdown {
  const result = getBetScore(match, homeScore, awayScore, winnerPick)

  if (result.scoreType === 'pending' || match.status !== 'finished') {
    return { isPending: true, totalPoints: 0, hits: [] }
  }

  const actualHome = match.score.home
  const actualAway = match.score.away

  if (actualHome === null || actualAway === null) {
    return { isPending: true, totalPoints: 0, hits: [] }
  }

  const hits: BetScoreBreakdownHit[] = []
  const scorePoints = result.points - result.winnerPoints

  if (scorePoints === 10 && homeScore != null && awayScore != null) {
    hits.push({
      title: 'Placar exato',
      description: `Acertou o placar ${formatScore(homeScore, awayScore)}.`,
      points: 10,
      tone: 'exact',
    })
  } else if (scorePoints === 3 && homeScore != null && awayScore != null) {
    hits.push({
      title: 'Acerto parcial',
      description: `Acertou quem venceu pelo placar previsto com diferença de até ${PARTIAL_MAX_GOAL_DIFFERENCE} gols. Palpite ${formatScore(homeScore, awayScore)}, resultado ${formatScore(actualHome, actualAway)}.`,
      points: 3,
      tone: 'partial',
    })
  }

  if (result.winnerPoints > 0 && winnerPick && isValidWinnerPick(winnerPick)) {
    hits.push({
      title: 'Quem vence?',
      description: `Acertou ${formatWinnerPickLabel(match as Match, winnerPick)} como vencedor do jogo.`,
      points: 2,
      tone: 'winner',
    })
  }

  return {
    isPending: false,
    totalPoints: result.points,
    hits,
  }
}
