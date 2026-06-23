import { validatePersonName as getPersonNameValidationError } from '../../shared/betValidation.js'
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '../../shared/participantCredentials.js'
import { formatPersonNameForStorage } from '../../shared/personNameFormat.js'
import {
  clearParticipantSessionCookie,
  createParticipantSessionToken,
  getParticipantSession,
  isParticipantAuthConfigured,
  setParticipantSessionCookie,
} from './participantAuth.js'
import {
  authenticateParticipantByEmail,
  claimLegacyParticipant,
  findUnclaimedLegacyParticipants,
  getLegacyNamePreview,
  registerParticipant,
} from './participantDb.js'
import {
  clearParticipantLoginAttempts,
  formatParticipantLoginBlockedMessage,
  getParticipantLoginBlockStatus,
  recordParticipantFailedLogin,
} from './participantLoginRateLimit.js'
import { readJsonBody, sendJson, sendTooManyRequests } from './httpUtils.js'
import { checkRateLimit, clearRateLimit, getClientIp } from './rateLimit.js'
import { ValidationError } from './validateInput.js'

const MAX_BODY_BYTES = 8_192
const AUTH_RATE_LIMIT = 10
const AUTH_RATE_WINDOW_MS = 60_000
const CHECK_NAME_RATE_LIMIT = 30
const CHECK_NAME_RATE_WINDOW_MS = 60_000
const UNCLAIMED_LIST_RATE_LIMIT = 30
const UNCLAIMED_LIST_RATE_WINDOW_MS = 60_000

function sendNotConfigured(res) {
  sendJson(res, 503, {
    message: 'Autenticação de participantes indisponível. Configure PARTICIPANT_SESSION_SECRET.',
    configured: false,
  })
}

function toParticipantResponse(participant) {
  return {
    id: participant.id,
    personName: participant.person_name,
    personNameKey: participant.person_name_key,
    email: participant.email,
  }
}

async function issueParticipantSession(res, req, participant) {
  const { token, maxAge } = createParticipantSessionToken({
    participantId: participant.id,
    personNameKey: participant.person_name_key,
    personName: participant.person_name,
  })

  await clearRateLimit(`participant-auth:${getClientIp(req)}`)
  setParticipantSessionCookie(res, token, maxAge)

  return toParticipantResponse(participant)
}

async function enforceAuthRateLimit(req, res) {
  const clientIp = getClientIp(req)
  const rateLimit = await checkRateLimit({
    key: `participant-auth:${clientIp}`,
    limit: AUTH_RATE_LIMIT,
    windowMs: AUTH_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendTooManyRequests(
      res,
      'Muitas tentativas. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return false
  }

  return true
}

function parseCredentialsBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Payload inválido.')
  }

  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const passwordConfirmation =
    typeof body.passwordConfirmation === 'string' ? body.passwordConfirmation : password

  const emailError = validateEmail(email)

  if (emailError) {
    throw new ValidationError(emailError)
  }

  const passwordError = validatePassword(password)

  if (passwordError) {
    throw new ValidationError(passwordError)
  }

  return {
    email: normalizeEmail(email),
    password,
    passwordConfirmation,
  }
}

function parseRegisterBody(body) {
  const credentials = parseCredentialsBody(body)
  const rawName = typeof body.personName === 'string' ? body.personName : ''
  const nameError = getPersonNameValidationError(rawName)

  if (nameError) {
    throw new ValidationError(nameError)
  }

  const confirmationError = validatePasswordConfirmation(
    credentials.password,
    credentials.passwordConfirmation,
  )

  if (confirmationError) {
    throw new ValidationError(confirmationError)
  }

  return {
    ...credentials,
    personName: formatPersonNameForStorage(rawName),
  }
}

function parsePersonNameFromQuery(url) {
  const parsed = new URL(url ?? '', 'http://localhost')
  const raw = parsed.searchParams.get('name')

  if (!raw || typeof raw !== 'string') {
    throw new ValidationError('Informe seu nome no bolão.')
  }

  const validationError = getPersonNameValidationError(raw)

  if (validationError) {
    throw new ValidationError(validationError)
  }

  return formatPersonNameForStorage(raw)
}

export async function handleParticipantSessionRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  const configured = isParticipantAuthConfigured()

  if (!configured) {
    sendJson(res, 200, { authenticated: false, configured: false, loginBlockedUntil: null })
    return
  }

  const blockStatus = await getParticipantLoginBlockStatus(getClientIp(req))
  const session = getParticipantSession(req)

  if (!session) {
    sendJson(res, 200, {
      authenticated: false,
      configured: true,
      loginBlockedUntil: blockStatus.blocked ? blockStatus.blockedUntil : null,
    })
    return
  }

  sendJson(res, 200, {
    authenticated: true,
    configured: true,
    loginBlockedUntil: null,
    participant: {
      id: session.participantId,
      personName: session.personName,
      personNameKey: session.personNameKey,
    },
  })
}

export async function handleParticipantUnclaimedRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  if (!isParticipantAuthConfigured()) {
    sendNotConfigured(res)
    return
  }

  const clientIp = getClientIp(req)
  const rateLimit = await checkRateLimit({
    key: `participant-unclaimed:${clientIp}`,
    limit: UNCLAIMED_LIST_RATE_LIMIT,
    windowMs: UNCLAIMED_LIST_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendTooManyRequests(
      res,
      'Muitas consultas. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return
  }

  try {
    const participants = await findUnclaimedLegacyParticipants()
    sendJson(res, 200, { participants })
  } catch (error) {
    console.error('[api/participant/unclaimed]', error)
    sendJson(res, 500, { message: 'Não foi possível carregar os participantes.' })
  }
}

export async function handleParticipantCheckNameRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  if (!isParticipantAuthConfigured()) {
    sendNotConfigured(res)
    return
  }

  const clientIp = getClientIp(req)
  const rateLimit = await checkRateLimit({
    key: `participant-check-name:${clientIp}`,
    limit: CHECK_NAME_RATE_LIMIT,
    windowMs: CHECK_NAME_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendTooManyRequests(
      res,
      'Muitas consultas. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return
  }

  try {
    const personName = parsePersonNameFromQuery(req.url)
    const status = await getLegacyNamePreview(personName)

    if (status.status === 'invalid') {
      sendJson(res, 400, { message: 'Nome inválido.' })
      return
    }

    sendJson(res, 200, status)
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })
      return
    }

    console.error('[api/participant/check-name]', error)
    sendJson(res, 500, { message: 'Não foi possível verificar o nome.' })
  }
}

export async function handleParticipantLoginRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  if (!isParticipantAuthConfigured()) {
    sendNotConfigured(res)
    return
  }

  const clientIp = getClientIp(req)
  const blockStatus = await getParticipantLoginBlockStatus(clientIp)

  if (blockStatus.blocked) {
    sendTooManyRequests(
      res,
      formatParticipantLoginBlockedMessage(blockStatus.retryAfterSeconds),
      blockStatus.retryAfterSeconds,
    )
    return
  }

  try {
    const body = await readJsonBody(req, MAX_BODY_BYTES)
    const { email, password } = parseCredentialsBody(body)
    const participant = await authenticateParticipantByEmail(email, password)

    if (!participant) {
      const failure = await recordParticipantFailedLogin(clientIp)

      if (failure.blocked) {
        sendTooManyRequests(
          res,
          formatParticipantLoginBlockedMessage(failure.retryAfterSeconds),
          failure.retryAfterSeconds,
        )
        return
      }

      sendJson(res, 401, {
        message: `E-mail ou senha incorretos. Restam ${failure.remainingAttempts} tentativa(s) antes do bloqueio.`,
      })
      return
    }

    await clearParticipantLoginAttempts(clientIp)
    const participantResponse = await issueParticipantSession(res, req, participant)

    sendJson(res, 200, {
      authenticated: true,
      participant: participantResponse,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })
      return
    }

    console.error('[api/participant/login]', error)
    sendJson(res, 500, { message: 'Não foi possível realizar o login.' })
  }
}

export async function handleParticipantRegisterRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  if (!isParticipantAuthConfigured()) {
    sendNotConfigured(res)
    return
  }

  if (!(await enforceAuthRateLimit(req, res))) {
    return
  }

  try {
    const body = await readJsonBody(req, MAX_BODY_BYTES)
    const payload = parseRegisterBody(body)
    const participant = await registerParticipant(payload)
    const participantResponse = await issueParticipantSession(res, req, participant)

    sendJson(res, 201, {
      authenticated: true,
      participant: participantResponse,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })
      return
    }

    if (error instanceof Error) {
      if (
        error.message === 'Este nome já está cadastrado no bolão.' ||
        error.message === 'Este e-mail já está cadastrado.' ||
        error.message.includes('Já palpitei')
      ) {
        sendJson(res, 409, { message: error.message })
        return
      }
    }

    console.error('[api/participant/register]', error)
    sendJson(res, 500, { message: 'Não foi possível criar o cadastro.' })
  }
}

export async function handleParticipantClaimRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  if (!isParticipantAuthConfigured()) {
    sendNotConfigured(res)
    return
  }

  if (!(await enforceAuthRateLimit(req, res))) {
    return
  }

  try {
    const body = await readJsonBody(req, MAX_BODY_BYTES)
    const payload = parseRegisterBody(body)
    const { participant, legacyBetCount } = await claimLegacyParticipant(payload)
    const participantResponse = await issueParticipantSession(res, req, participant)

    sendJson(res, 201, {
      authenticated: true,
      claimed: true,
      legacyBetCount,
      participant: participantResponse,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })
      return
    }

    if (error instanceof Error) {
      if (
        error.message.includes('já possui cadastro') ||
        error.message === 'Este e-mail já está cadastrado.' ||
        error.message.includes('Não encontramos palpites')
      ) {
        sendJson(res, 409, { message: error.message })
        return
      }
    }

    console.error('[api/participant/claim]', error)
    sendJson(res, 500, { message: 'Não foi possível vincular seus palpites.' })
  }
}

export async function handleParticipantLogoutRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  clearParticipantSessionCookie(res)
  sendJson(res, 200, { authenticated: false })
}
