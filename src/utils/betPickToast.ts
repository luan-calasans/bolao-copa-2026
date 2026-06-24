import type { WinnerPick } from '../models/winnerPick'
import { hasBetScorePick } from './betValidation'
import { isValidWinnerPick } from './winnerPickValidation'

export type BetComplementMode = 'none' | 'add-winner' | 'add-score' | 'complete'

export function getBetSubmitSuccessMessage(
  complementMode: BetComplementMode,
  winnerPick: WinnerPick | null | undefined,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): string {
  if (complementMode === 'add-winner') {
    return 'Quem vence adicionado ao seu palpite!'
  }

  if (complementMode === 'add-score') {
    return 'Placar adicionado ao seu palpite!'
  }

  const hasScore = hasBetScorePick(homeScore, awayScore)
  const hasWinner = isValidWinnerPick(winnerPick)

  if (hasScore && hasWinner) {
    return 'Palpite registrado com placar e vencedor!'
  }

  if (hasScore) {
    return 'Placar registrado!'
  }

  if (hasWinner) {
    return 'Palpite de vencedor registrado!'
  }

  return 'Palpite registrado!'
}
