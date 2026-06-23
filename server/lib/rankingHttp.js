import { SCORING_RULES } from './betScoring.js'
import { sendJson } from './httpUtils.js'
import { getRankingSnapshot } from './rankingDb.js'
import { checkRateLimit, getClientIp, sendRateLimitResponse } from './rateLimit.js'
import {
  isFootballConfigError,
  isPostgresConfigError,
  PUBLIC_MESSAGES,
} from './userFacingErrors.js'

const RANKING_RATE_LIMIT = 20
const RANKING_RATE_WINDOW_MS = 60_000

export async function handleRankingRequest(req, res) {
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

  const rateLimit = await checkRateLimit({
    key: `ranking:${getClientIp(req)}`,
    limit: RANKING_RATE_LIMIT,
    windowMs: RANKING_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendRateLimitResponse(
      res,
      'Muitas consultas ao ranking. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return
  }

  try {
    const snapshot = await getRankingSnapshot()
    sendJson(res, 200, {
      rules: SCORING_RULES,
      ...snapshot,
    })
  } catch (error) {
    console.error('[api/ranking]', error)

    const isDev = process.env.NODE_ENV !== 'production'
    const configError = isPostgresConfigError(error) || isFootballConfigError(error)

    if (configError) {
      sendJson(res, 503, { message: PUBLIC_MESSAGES.SERVICE_UNAVAILABLE })
      return
    }

    if (isDev && error instanceof Error && error.message) {
      sendJson(res, 500, { message: error.message })
      return
    }

    sendJson(res, 500, { message: PUBLIC_MESSAGES.RANKING_UNAVAILABLE })
  }
}
