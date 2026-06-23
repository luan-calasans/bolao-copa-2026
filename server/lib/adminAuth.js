import crypto from 'node:crypto'
import { isProduction } from './env.js'
import { isAdminSessionRevoked, revokeAdminSession } from './adminSessionRevocation.js'

const COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE_SEC = 2 * 60 * 60

export function getAdminPassword() {
  return (process.env.ADMIN_PASSWORD || '').trim()
}

function getSessionSecret() {
  return (process.env.ADMIN_SESSION_SECRET || '').trim()
}

function timingSafeEqualStrings(a, b) {
  const hashA = crypto.createHash('sha256').update(a).digest()
  const hashB = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword() && getSessionSecret())
}

export function verifyAdminPassword(password) {
  const expected = getAdminPassword()
  if (!expected || typeof password !== 'string') return false
  return timingSafeEqualStrings(password, expected)
}

export function createSessionToken() {
  const secret = getSessionSecret()
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET não configurado.')
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = now + SESSION_MAX_AGE_SEC
  const jti = crypto.randomUUID()
  const payloadB64 = Buffer.from(JSON.stringify({ exp, iat: now, jti })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')

  return {
    token: `${payloadB64}.${signature}`,
    maxAge: SESSION_MAX_AGE_SEC,
    jti,
    exp,
  }
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
    if (!payload.exp || !payload.jti || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
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

export async function isAdminAuthenticated(req) {
  const cookies = parseCookies(req)
  const payload = parseSessionPayload(cookies[COOKIE_NAME])

  if (!payload) {
    return false
  }

  return !(await isAdminSessionRevoked(payload.jti))
}

export async function revokeAdminSessionFromRequest(req) {
  const cookies = parseCookies(req)
  const payload = parseSessionPayload(cookies[COOKIE_NAME])

  if (!payload) {
    return
  }

  await revokeAdminSession(payload.jti, payload.exp)
}

function buildCookieAttributes(maxAge) {
  const secure = isProduction() ? '; Secure' : ''
  return `HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`
}

export function setSessionCookie(res, token, maxAge) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; ${buildCookieAttributes(maxAge)}`,
  )
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${buildCookieAttributes(0)}`)
}

export { parseSessionPayload }
