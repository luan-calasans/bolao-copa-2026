const PARTICIPANT_LOGIN_URL = '/api/participant/login'
const PARTICIPANT_REGISTER_URL = '/api/participant/register'
const PARTICIPANT_CLAIM_URL = '/api/participant/claim'
const PARTICIPANT_LOGOUT_URL = '/api/participant/logout'
const PARTICIPANT_SESSION_URL = '/api/participant/session'
const PARTICIPANT_UNCLAIMED_URL = '/api/participant/unclaimed'
const PARTICIPANT_CHECK_NAME_URL = '/api/participant/check-name'

const participantFetchInit: RequestInit = {
  credentials: 'include',
}

export interface ParticipantInfo {
  id: string
  personName: string
  personNameKey: string
  email?: string
}

export interface ParticipantSession {
  authenticated: boolean
  configured: boolean
  loginBlockedUntil?: number | null
  participant?: ParticipantInfo
}

export type LegacyNamePreview =
  | { status: 'claimable'; displayName: string; legacyBetCount: number }
  | { status: 'registered'; displayName: string }
  | { status: 'no_bets'; displayName: string }

export interface UnclaimedLegacyParticipant {
  personNameKey: string
  displayName: string
  legacyBetCount: number
}

export type ParticipantAuthMode = 'login' | 'register' | 'claim'

export class ParticipantAuthError extends Error {
  readonly statusCode: number
  readonly code?: string
  readonly retryAfterSeconds?: number

  constructor(
    message: string,
    statusCode: number,
    options?: { code?: string; retryAfterSeconds?: number },
  ) {
    super(message)
    this.name = 'ParticipantAuthError'
    this.statusCode = statusCode
    this.code = options?.code
    this.retryAfterSeconds = options?.retryAfterSeconds
  }
}

/** @deprecated Use ParticipantAuthError */
export const ParticipantLoginError = ParticipantAuthError

async function parseErrorBody(
  response: Response,
  fallback: string,
): Promise<{ message: string; code?: string; retryAfterSeconds?: number }> {
  try {
    const body = (await response.json()) as {
      message?: string
      code?: string
      retryAfterSeconds?: number
    }
    const headerRetryAfter = Number(response.headers.get('Retry-After'))
    const bodyRetryAfter = Number(body.retryAfterSeconds)
    const retryAfterSeconds = [headerRetryAfter, bodyRetryAfter].find(
      (value) => Number.isFinite(value) && value > 0,
    )

    return {
      message: body.message ?? fallback,
      code: body.code,
      retryAfterSeconds,
    }
  } catch {
    return { message: fallback }
  }
}

export async function getParticipantSession(): Promise<ParticipantSession> {
  const response = await fetch(PARTICIPANT_SESSION_URL, participantFetchInit)

  if (!response.ok) {
    throw new Error('Não foi possível verificar a sessão.')
  }

  return (await response.json()) as ParticipantSession
}

export async function fetchUnclaimedLegacyParticipants(): Promise<UnclaimedLegacyParticipant[]> {
  const response = await fetch(PARTICIPANT_UNCLAIMED_URL, participantFetchInit)

  if (!response.ok) {
    const { message } = await parseErrorBody(
      response,
      'Não foi possível carregar os participantes.',
    )
    throw new ParticipantAuthError(message, response.status)
  }

  const body = (await response.json()) as { participants: UnclaimedLegacyParticipant[] }
  return body.participants ?? []
}

export async function previewLegacyParticipantName(
  personName: string,
): Promise<LegacyNamePreview> {
  const params = new URLSearchParams({ name: personName })
  const response = await fetch(`${PARTICIPANT_CHECK_NAME_URL}?${params}`, participantFetchInit)

  if (!response.ok) {
    const { message } = await parseErrorBody(response, 'Não foi possível verificar o nome.')
    throw new ParticipantAuthError(message, response.status)
  }

  return (await response.json()) as LegacyNamePreview
}

export async function loginParticipantWithEmail(
  email: string,
  password: string,
): Promise<ParticipantInfo> {
  const response = await fetch(PARTICIPANT_LOGIN_URL, {
    ...participantFetchInit,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const { message, code, retryAfterSeconds } = await parseErrorBody(
      response,
      'Não foi possível realizar o login.',
    )
    throw new ParticipantAuthError(message, response.status, { code, retryAfterSeconds })
  }

  const body = (await response.json()) as { participant: ParticipantInfo }
  return body.participant
}

export async function registerParticipantAccount(input: {
  personName: string
  email: string
  password: string
  passwordConfirmation: string
}): Promise<ParticipantInfo> {
  const response = await fetch(PARTICIPANT_REGISTER_URL, {
    ...participantFetchInit,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const { message, code } = await parseErrorBody(response, 'Não foi possível criar o cadastro.')
    throw new ParticipantAuthError(message, response.status, { code })
  }

  const body = (await response.json()) as { participant: ParticipantInfo }
  return body.participant
}

export async function claimLegacyParticipantAccount(input: {
  personName: string
  email: string
  password: string
  passwordConfirmation: string
}): Promise<{ participant: ParticipantInfo; legacyBetCount: number }> {
  const response = await fetch(PARTICIPANT_CLAIM_URL, {
    ...participantFetchInit,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const { message, code } = await parseErrorBody(
      response,
      'Não foi possível vincular seus palpites.',
    )
    throw new ParticipantAuthError(message, response.status, { code })
  }

  const body = (await response.json()) as {
    participant: ParticipantInfo
    legacyBetCount: number
  }

  return body
}

export async function logoutParticipant(): Promise<void> {
  const response = await fetch(PARTICIPANT_LOGOUT_URL, {
    ...participantFetchInit,
    method: 'POST',
  })

  if (!response.ok) {
    const { message } = await parseErrorBody(response, 'Não foi possível encerrar a sessão.')
    throw new Error(message)
  }
}
