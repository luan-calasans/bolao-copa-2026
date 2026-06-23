import { checkRateLimit, clearRateLimit, getClientIp, peekRateLimit } from './rateLimit.js'

const MAX_FAILED_ATTEMPTS = 3
const BLOCK_DURATION_MS = 5 * 60 * 1000

export { getClientIp }

function loginRateLimitKey(ip) {
  return `admin-login-fail:${ip}`
}

function toBlockedStatus(rateLimit) {
  const retryAfterSeconds = rateLimit.retryAfterSeconds ?? Math.ceil(BLOCK_DURATION_MS / 1000)

  return {
    blocked: true,
    blockedUntil: Date.now() + retryAfterSeconds * 1000,
    retryAfterSeconds,
  }
}

export async function getLoginBlockStatus(ip) {
  const rateLimit = await peekRateLimit({
    key: loginRateLimitKey(ip),
    limit: MAX_FAILED_ATTEMPTS - 1,
  })

  const count = rateLimit.count ?? 0

  if (rateLimit.limited || count >= MAX_FAILED_ATTEMPTS) {
    return toBlockedStatus(rateLimit)
  }

  return { blocked: false }
}

export async function recordFailedLogin(ip) {
  const rateLimit = await checkRateLimit({
    key: loginRateLimitKey(ip),
    limit: MAX_FAILED_ATTEMPTS - 1,
    windowMs: BLOCK_DURATION_MS,
  })

  const count = rateLimit.count ?? MAX_FAILED_ATTEMPTS

  if (rateLimit.limited || count >= MAX_FAILED_ATTEMPTS) {
    return toBlockedStatus(rateLimit)
  }

  return {
    blocked: false,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - count),
  }
}

export async function clearLoginAttempts(ip) {
  await clearRateLimit(loginRateLimitKey(ip))
}

export function formatBlockedMessage(retryAfterSeconds) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60))
  return `Muitas tentativas incorretas. Acesso bloqueado por ${minutes} minuto(s).`
}
