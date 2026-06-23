import crypto from 'node:crypto'
import { isProduction } from './env.js'

const COOKIE_NAME = 'participant_session'
const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60

function getSessionSecret() {
  return (process.env.PARTICIPANT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || '').trim()
}

function timingSafeEqualStrings(a, b) {
  const hashA = crypto.createHash('sha256').update(a).digest()
  const hashB = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

export function isParticipantAuthConfigured() {
  return Boolean(getSessionSecret())
}

function parseSessionPayload(token) {
  if (!token || typeof token !== 'string') return null

  const secret = getSessionSecret()
  if (!secret) return null

  const separatorIndex = token.lastIndexOf('.')
  if (separatorIndex <= 0) return null

  const payloadB64 = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url')

  if (!timingSafeEqualStrings(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (
      !payload.exp ||
      !payload.jti ||
      !payload.participantId ||
      !payload.personNameKey ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function createParticipantSessionToken({ participantId, personNameKey, personName }) {
  const secret = getSessionSecret()
  if (!secret) {
    throw new Error('PARTICIPANT_SESSION_SECRET não configurado.')
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = now + SESSION_MAX_AGE_SEC
  const jti = crypto.randomUUID()
  const payloadB64 = Buffer.from(
    JSON.stringify({ exp, iat: now, jti, participantId, personNameKey, personName }),
  ).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')

  return {
    token: `${payloadB64}.${signature}`,
    maxAge: SESSION_MAX_AGE_SEC,
    jti,
    exp,
  }
}

export function parseCookies(req) {
  const header = req.headers?.cookie
  if (!header) return {}

  const cookies = {}

  for (const part of header.split(';')) {
    const separatorIndex = part.indexOf('=')
    if (separatorIndex === -1) continue

    const key = part.slice(0, separatorIndex).trim()
    const value = part.slice(separatorIndex + 1).trim()
    cookies[key] = decodeURIComponent(value)
  }

  return cookies
}

export function getParticipantSession(req) {
  const cookies = parseCookies(req)
  const payload = parseSessionPayload(cookies[COOKIE_NAME])

  if (!payload) {
    return null
  }

  return {
    participantId: payload.participantId,
    personNameKey: payload.personNameKey,
    personName: payload.personName,
  }
}

function buildCookieAttributes(maxAge) {
  const secure = isProduction() ? '; Secure' : ''
  return `HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`
}

export function setParticipantSessionCookie(res, token, maxAge) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; ${buildCookieAttributes(maxAge)}`,
  )
}

export function clearParticipantSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${buildCookieAttributes(0)}`)
}
