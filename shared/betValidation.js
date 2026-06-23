import { hasControlCharacters } from './textValidation.js'
import { isValidWinnerPick } from './winnerPick.js'

export const MAX_BET_SCORE = 20
export const MAX_PERSON_NAME_LENGTH = 80
export const MIN_PERSON_NAME_LENGTH = 2
export const PERSON_NAME_NO_DIGITS_MESSAGE = 'Não é permitido usar números no nome.'

export function personNameContainsDigits(value) {
  return /\d/.test(value)
}

export function sanitizePersonNameInput(value) {
  return value.replace(/\d/g, '')
}

export function getLiveMinScores(isLive, homeScore, awayScore) {
  if (!isLive) {
    return { home: 0, away: 0 }
  }

  return {
    home: homeScore ?? 0,
    away: awayScore ?? 0,
  }
}

export function clampBetScore(value, minimum) {
  return Math.min(MAX_BET_SCORE, Math.max(minimum, value))
}

export function hasBetScorePick(homeScore, awayScore) {
  return (
    homeScore !== null &&
    homeScore !== undefined &&
    awayScore !== null &&
    awayScore !== undefined
  )
}

export function validateBetContent(winnerPick, homeScore, awayScore) {
  const hasWinner = isValidWinnerPick(winnerPick)
  const hasScore = hasBetScorePick(homeScore, awayScore)
  const homeMissing = homeScore === null || homeScore === undefined
  const awayMissing = awayScore === null || awayScore === undefined

  if (homeMissing !== awayMissing) {
    return 'Informe o placar completo ou limpe os dois gols.'
  }

  if (!hasWinner && !hasScore) {
    return 'Informe quem vence, o placar previsto ou ambos.'
  }

  return null
}

export function validateBetScores(minHome, minAway, homeScore, awayScore) {
  if (!hasBetScorePick(homeScore, awayScore)) {
    return null
  }

  if (homeScore < minHome) {
    return `O mandante já marcou ${minHome} gol(s). O palpite deve ser no mínimo ${minHome}.`
  }

  if (awayScore < minAway) {
    return `O visitante já marcou ${minAway} gol(s). O palpite deve ser no mínimo ${minAway}.`
  }

  if (homeScore > MAX_BET_SCORE || awayScore > MAX_BET_SCORE) {
    return `Informe placares válidos entre ${minHome} e ${MAX_BET_SCORE}.`
  }

  return null
}

export function validatePersonName(name) {
  if (typeof name !== 'string') {
    return 'Nome inválido.'
  }

  const trimmed = name.trim()

  if (!trimmed) {
    return 'Informe seu nome no bolão.'
  }

  if (trimmed.length < MIN_PERSON_NAME_LENGTH) {
    return 'O nome deve ter pelo menos 2 caracteres.'
  }

  if (trimmed.length > MAX_PERSON_NAME_LENGTH) {
    return 'O nome deve ter no máximo 80 caracteres.'
  }

  if (hasControlCharacters(trimmed)) {
    return 'Nome inválido.'
  }

  if (personNameContainsDigits(trimmed)) {
    return PERSON_NAME_NO_DIGITS_MESSAGE
  }

  return null
}
