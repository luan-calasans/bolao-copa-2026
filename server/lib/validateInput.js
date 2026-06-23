import { validatePersonName as getPersonNameValidationError, validateBetContent, hasBetScorePick } from '../../shared/betValidation.js'
import { formatPersonNameForStorage } from '../../shared/personNameFormat.js'
import { validateWinnerPick as getWinnerPickValidationError } from '../../shared/winnerPick.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LEGACY_RECEIPT_ID_PATTERN = /^[A-Z0-9]{6,12}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/

const MAX_BET_SCORE = 20
const MAX_ENTITY_ID = 9_999_999

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

function assertEntityId(value, invalidMessage) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_ENTITY_ID) {
    throw new ValidationError(invalidMessage)
  }

  return parsed
}

export function assertSafeMatchId(matchId) {
  return assertEntityId(matchId, 'Identificador do jogo inválido.')
}

export function assertSafeTeamId(teamId) {
  return assertEntityId(teamId, 'Seleção inválida.')
}

export function assertSafeReceiptId(receiptId) {
  if (typeof receiptId !== 'string') {
    throw new ValidationError('Identificador do comprovante inválido.')
  }

  const normalized = receiptId.trim()

  if (UUID_PATTERN.test(normalized)) {
    return normalized.toLowerCase()
  }

  if (LEGACY_RECEIPT_ID_PATTERN.test(normalized)) {
    return normalized
  }

  throw new ValidationError('Identificador do comprovante inválido.')
}

function assertIsoDate(value, fieldName) {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    throw new ValidationError(`${fieldName} inválido.`)
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    throw new ValidationError(`${fieldName} inválido.`)
  }

  return value
}

function assertIntegerInRange(value, fieldName, min, max) {
  if (!Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} inválido.`)
  }

  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} fora do intervalo permitido.`)
  }

  return value
}

function assertPersonName(value) {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError('Informe seu nome no bolão.')
  }

  const validationError = getPersonNameValidationError(value)

  if (validationError) {
    throw new ValidationError(validationError)
  }

  return formatPersonNameForStorage(value)
}

function assertOptionalWinnerPick(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const validationError = getWinnerPickValidationError(value)

  if (validationError) {
    throw new ValidationError(validationError)
  }

  return value
}

function assertOptionalScore(value, fieldName) {
  if (value === null || value === undefined) {
    return null
  }

  return assertIntegerInRange(value, fieldName, 0, MAX_BET_SCORE)
}

function assertPayloadEnvelope(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Payload inválido.')
  }

  const { bet, receipt } = body

  if (bet === null || typeof bet !== 'object' || Array.isArray(bet)) {
    throw new ValidationError('Payload inválido.')
  }

  if (receipt === null || typeof receipt !== 'object' || Array.isArray(receipt)) {
    throw new ValidationError('Payload inválido.')
  }

  return { bet, receipt }
}

function assertReceiptFields(receipt) {
  return {
    id: assertSafeReceiptId(receipt.id),
    generatedAt: assertIsoDate(receipt.generatedAt, 'Data de geração'),
  }
}

export function parseBetPayload(body) {
  const { bet, receipt } = assertPayloadEnvelope(body)
  const receiptFields = assertReceiptFields(receipt)
  const createdAt = assertIsoDate(bet.createdAt, 'Data do palpite')
  const matchId = assertIntegerInRange(bet.matchId, 'Jogo', 1, MAX_ENTITY_ID)
  const homeScore = assertOptionalScore(bet.homeScore, 'Placar do mandante')
  const awayScore = assertOptionalScore(bet.awayScore, 'Placar do visitante')
  const personName = assertPersonName(bet.personName)
  const winnerPick = assertOptionalWinnerPick(bet.winnerPick)

  const contentError = validateBetContent(winnerPick, homeScore, awayScore)
  if (contentError) {
    throw new ValidationError(contentError)
  }

  return {
    receipt: receiptFields,
    bet: {
      matchId,
      homeScore,
      awayScore,
      winnerPick,
      personName,
      createdAt,
    },
  }
}

export function parseChampionBetPayload(body) {
  const { bet, receipt } = assertPayloadEnvelope(body)
  const receiptFields = assertReceiptFields(receipt)
  const createdAt = assertIsoDate(bet.createdAt, 'Data do palpite')
  const teamId = assertSafeTeamId(bet.teamId)
  const personName = assertPersonName(bet.personName)

  return {
    receipt: receiptFields,
    bet: {
      teamId,
      personName,
      createdAt,
    },
  }
}
