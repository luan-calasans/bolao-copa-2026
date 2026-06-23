import crypto from 'node:crypto'
import { isProduction } from './env.js'
import { PUBLIC_MESSAGES } from './userFacingErrors.js'

function getConfiguredToken() {
  return (process.env.BOLAO_ACCESS_TOKEN || '').trim()
}

function timingSafeEqualStrings(a, b) {
  const hashA = crypto.createHash('sha256').update(a).digest()
  const hashB = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

export function isBolaoAccessConfigured() {
  return getConfiguredToken().length > 0
}

export function isBolaoAccessRequired() {
  return isProduction()
}

export function getBolaoAccessTokenFromRequest(req) {
  const headerToken = req.headers?.['x-bolao-token']

  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim()
  }

  const authorization = req.headers?.authorization

  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  return ''
}

export function isBolaoAccessAuthorized(req) {
  const configured = getConfiguredToken()

  if (isBolaoAccessRequired() && !configured) {
    return false
  }

  if (!configured) {
    return true
  }

  const provided = getBolaoAccessTokenFromRequest(req)
  return provided.length > 0 && timingSafeEqualStrings(provided, configured)
}

export function sendBolaoNotConfigured(res) {
  res.statusCode = 503
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(
    JSON.stringify({
      message: PUBLIC_MESSAGES.BOLAO_UNAVAILABLE,
    }),
  )
}

export function sendBolaoUnauthorized(res) {
  res.statusCode = 401
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(
    JSON.stringify({
      message: 'Não foi possível acessar os palpites no momento.',
    }),
  )
}
