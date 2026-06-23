import {
  findAllBets,
  findBetsByMatchId,
  findReceiptById,
  insertBetAndReceipt,
  tryResolveExistingBet,
} from './betDb.js'

import {
  isBolaoAccessAuthorized,
  isBolaoAccessConfigured,
  isBolaoAccessRequired,
  sendBolaoNotConfigured,
  sendBolaoUnauthorized,
} from './bolaoAccess.js'

import { fetchMatchById } from './footballApi.js'

import { readJsonBody, sendJson } from './httpUtils.js'

import { buildMatchSnapshot } from './matchSnapshot.js'

import { assertBetScoresAllowed, assertMatchAcceptsBets } from './matchBetRules.js'

import { checkRateLimit, getClientIp, sendRateLimitResponse } from './rateLimit.js'

import {
  ValidationError,
  assertSafeMatchId,
  assertSafeReceiptId,
  parseBetPayload,
} from './validateInput.js'
import { isPostgresConfigError, PUBLIC_MESSAGES } from './userFacingErrors.js'

const MAX_BODY_BYTES = 65_536

const LIST_RATE_LIMIT = 30

const LIST_RATE_WINDOW_MS = 60_000

function getMatchIdFromUrl(url) {
  const parsed = new URL(url, 'http://localhost')
  const matchId = parsed.searchParams.get('matchId')

  if (!matchId) {
    return null
  }

  return assertSafeMatchId(matchId)
}

function requiresBolaoAccess(req, url) {
  const parsed = new URL(url ?? '', 'http://localhost')
  const hasReceiptId = parsed.searchParams.has('receiptId')
  const hasMatchId = parsed.searchParams.has('matchId')

  if (req.method === 'POST') {
    return true
  }

  if (req.method === 'GET' && !hasReceiptId && !hasMatchId) {
    return true
  }

  return false
}

async function enforceBolaoAccess(req, res, url) {
  if (!requiresBolaoAccess(req, url)) {
    return true
  }

  if (isBolaoAccessRequired() && !isBolaoAccessConfigured()) {
    sendBolaoNotConfigured(res)

    return false
  }

  if (!isBolaoAccessAuthorized(req)) {
    sendBolaoUnauthorized(res)

    return false
  }

  return true
}

async function enforceBetRateLimit(req, res) {
  if (req.method !== 'GET') {
    return true
  }

  const parsed = new URL(req.url ?? '', 'http://localhost')
  const isListAll = !parsed.searchParams.has('receiptId') && !parsed.searchParams.has('matchId')

  if (!isListAll) {
    return true
  }

  const clientIp = getClientIp(req)

  const rateLimit = await checkRateLimit({
    key: `bets-list:${clientIp}`,
    limit: LIST_RATE_LIMIT,
    windowMs: LIST_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendRateLimitResponse(
      res,
      'Muitas consultas à lista de palpites. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )

    return false
  }

  return true
}

async function prepareBetForStorage(bet) {
  const apiMatch = await fetchMatchById(bet.matchId)

  if (!apiMatch) {
    throw new ValidationError('Jogo não encontrado.')
  }

  assertMatchAcceptsBets(apiMatch)

  assertBetScoresAllowed(apiMatch, bet.homeScore, bet.awayScore)

  return {
    ...bet,

    match: buildMatchSnapshot(apiMatch),
  }
}

export async function handleBetsRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bolao-Token, Authorization')

    res.end()

    return
  }

  try {
    if (!(await enforceBolaoAccess(req, res, req.url))) {
      return
    }

    if (!(await enforceBetRateLimit(req, res))) {
      return
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, MAX_BODY_BYTES)

      const { receipt, bet } = parseBetPayload(body)

      const existingReceiptId = await tryResolveExistingBet(receipt.id, bet)

      if (existingReceiptId) {
        sendJson(res, 200, { receiptId: existingReceiptId })

        return
      }

      const betWithSnapshot = await prepareBetForStorage(bet)

      const { receiptId, created } = await insertBetAndReceipt(receipt, betWithSnapshot)

      sendJson(res, created ? 201 : 200, { receiptId })

      return
    }

    if (req.method === 'GET') {
      const parsed = new URL(req.url ?? '', 'http://localhost')

      const hasReceiptId = parsed.searchParams.has('receiptId')

      const hasMatchId = parsed.searchParams.has('matchId')

      if (hasMatchId) {
        let matchId

        try {
          matchId = getMatchIdFromUrl(req.url ?? '')
        } catch {
          sendJson(res, 400, { message: 'Parâmetro matchId inválido.' })

          return
        }

        const bets = await findBetsByMatchId(matchId)

        sendJson(res, 200, { matchId, bets })

        return
      }

      if (hasReceiptId) {
        let receiptId

        try {
          receiptId = assertSafeReceiptId(parsed.searchParams.get('receiptId'))
        } catch {
          sendJson(res, 400, { message: 'Parâmetro receiptId inválido.' })

          return
        }

        const stored = await findReceiptById(receiptId)

        if (!stored) {
          sendJson(res, 404, { message: 'Comprovante não encontrado.' })

          return
        }

        sendJson(res, 200, stored)

        return
      }

      const bets = await findAllBets()

      sendJson(res, 200, { bets })

      return
    }

    if (req.method === 'DELETE') {
      sendJson(res, 403, {
        message: 'Exclusão de palpites restrita à área administrativa.',
      })

      return
    }

    sendJson(res, 405, { message: 'Método não permitido.' })
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })

      return
    }

    console.error('[api/bets]', error)

    const isDev = process.env.NODE_ENV !== 'production'

    const configError = isPostgresConfigError(error)

    if (configError) {
      sendJson(res, 503, { message: PUBLIC_MESSAGES.SERVICE_UNAVAILABLE })

      return
    }

    if (isDev && error instanceof Error && error.message) {
      sendJson(res, 500, { message: error.message })

      return
    }

    sendJson(res, 500, { message: PUBLIC_MESSAGES.DATABASE_UNAVAILABLE })
  }
}
