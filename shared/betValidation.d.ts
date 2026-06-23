export const MAX_BET_SCORE: 20
export const MAX_PERSON_NAME_LENGTH: 80
export const MIN_PERSON_NAME_LENGTH: 2
export const PERSON_NAME_NO_DIGITS_MESSAGE: 'Não é permitido usar números no nome.'

export function personNameContainsDigits(value: string): boolean

export function sanitizePersonNameInput(value: string): string

export interface MinBetScores {
  home: number
  away: number
}

export function getLiveMinScores(
  isLive: boolean,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): MinBetScores

export function clampBetScore(value: number, minimum: number): number

export function validateBetScores(
  minHome: number,
  minAway: number,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): string | null

export function validateBetContent(
  winnerPick: unknown,
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): string | null

export function hasBetScorePick(
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
): boolean

export function validatePersonName(name: string): string | null
