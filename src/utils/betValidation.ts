import type { Match } from '../models/match'
import {
  clampBetScore as clampBetScoreShared,
  getLiveMinScores,
  validateBetScores as validateBetScoresShared,
  validateBetContent as validateBetContentShared,
  validatePersonName as validatePersonNameShared,
  hasBetScorePick as hasBetScorePickShared,
  personNameContainsDigits as personNameContainsDigitsShared,
  sanitizePersonNameInput as sanitizePersonNameInputShared,
  PERSON_NAME_NO_DIGITS_MESSAGE,
  type MinBetScores as SharedMinBetScores,
} from '../../shared/betValidation.js'
import type { WinnerPick } from '../models/winnerPick'

export type MinBetScores = SharedMinBetScores

export { PERSON_NAME_NO_DIGITS_MESSAGE }

export function personNameContainsDigits(value: string): boolean {
  return personNameContainsDigitsShared(value)
}

export function sanitizePersonNameInput(value: string): string {
  return sanitizePersonNameInputShared(value)
}

export function hasBetScorePick(
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): boolean {
  return hasBetScorePickShared(homeScore, awayScore)
}

export function getMinBetScores(match: Match): MinBetScores {
  return getLiveMinScores(match.isLive, match.score.home, match.score.away)
}

export function clampBetScore(value: number, minimum: number): number {
  return clampBetScoreShared(value, minimum)
}

export function validateBetScores(
  match: Match,
  homeScore: number,
  awayScore: number,
): string | null {
  const min = getMinBetScores(match)
  return validateBetScoresShared(min.home, min.away, homeScore, awayScore)
}

export function validateBetContent(
  winnerPick: WinnerPick | null | undefined,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): string | null {
  return validateBetContentShared(winnerPick, homeScore, awayScore)
}

export function hasValidPersonName(name: string): boolean {
  return validatePersonName(name) === null
}

export function validatePersonName(name: string): string | null {
  return validatePersonNameShared(name)
}
