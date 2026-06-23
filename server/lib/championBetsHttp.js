import { canAcceptChampionBet, getChampionBetBlockReason, getChampionBetDeadlineMs } from '../../shared/championBetAcceptance.js'
import { CHAMPION_BET_POINTS } from '../../shared/championBetConstants.js'
import { findWorldCupFinalMatch } from '../../shared/finalMatch.js'
import {
  findAllChampionBets,
  findChampionBetByReceiptId,
  insertChampionBetAndReceipt,
  tryResolveExistingChampionBet,
} from './championBetDb.js'
import {
  isBolaoAccessAuthorized,
  isBolaoAccessConfigured,
  isBolaoAccessRequired,
  sendBolaoNotConfigured,
  sendBolaoUnauthorized,
} from './bolaoAccess.js'
import { fetchWorldCupMatchesForChampion, fetchWorldCupTeams } from './footballApi.js'
import { readJsonBody, sendJson } from './httpUtils.js'
import { checkRateLimit, getClientIp, sendRateLimitResponse } from './rateLimit.js'
import {
  ValidationError,
  assertSafeReceiptId,
  parseChampionBetPayload,
} from './validateInput.js'
import { isPostgresConfigError, PUBLIC_MESSAGES } from './userFacingErrors.js'

const MAX_BODY_BYTES = 65_536
const LIST_RATE_LIMIT = 30
const LIST_RATE_WINDOW_MS = 60_000

function requiresBolaoAccess(req, url) {
  const parsed = new URL(url ?? '', 'http://localhost')
  const hasReceiptId = parsed.searchParams.has('receiptId')

  if (req.method === 'POST') {
    return true
  }

  if (req.method === 'GET' && !hasReceiptId) {
    return true
  }

  return false
}

async function enforceBolaoAccess(req, res) {
  if (!requiresBolaoAccess(req, req.url)) {
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

async function enforceListRateLimit(req, res) {
  if (req.method !== 'GET') {
    return true
  }

  const parsed = new URL(req.url ?? '', 'http://localhost')

  if (parsed.searchParams.has('receiptId')) {
    return true
  }

  const clientIp = getClientIp(req)
  const rateLimit = await checkRateLimit({
    key: `champion-bets-list:${clientIp}`,
    limit: LIST_RATE_LIMIT,
    windowMs: LIST_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendRateLimitResponse(
      res,
      'Muitas consultas ao palpite de campeão. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return false
  }

  return true
}

function buildTeamSnapshot(team) {
  return {
    id: team.id,
    name: team.name?.trim() ?? '',
    shortName: team.shortName?.trim() ?? team.name?.trim() ?? '',
    tla: team.tla?.trim() ?? '',
    crest: team.crest ?? null,
  }
}

async function loadChampionMeta() {
  const matches = await fetchWorldCupMatchesForChampion()
  const finalMatch = findWorldCupFinalMatch(matches)
  const deadlineMs = getChampionBetDeadlineMs(finalMatch)
  const blockReason = getChampionBetBlockReason(finalMatch)

  return {
    finalMatch: finalMatch
      ? {
          id: finalMatch.id,
          utcDate: finalMatch.utcDate,
          status: finalMatch.status,
          homeTeam: finalMatch.homeTeam,
          awayTeam: finalMatch.awayTeam,
        }
      : null,
    deadline: deadlineMs != null ? new Date(deadlineMs).toISOString() : null,
    acceptingBets: canAcceptChampionBet(finalMatch),
    blockReason,
    points: CHAMPION_BET_POINTS,
  }
}

async function prepareChampionBetForStorage(bet) {
  const matches = await fetchWorldCupMatchesForChampion()
  const finalMatch = findWorldCupFinalMatch(matches)
  const blockReason = getChampionBetBlockReason(finalMatch)

  if (blockReason) {
    throw new ValidationError(blockReason)
  }

  const teams = await fetchWorldCupTeams()
  const selectedTeam = teams.find((team) => team.id === bet.teamId)

  if (!selectedTeam) {
    throw new ValidationError('Seleção inválida para a Copa do Mundo.')
  }

  return {
    ...bet,
    team: buildTeamSnapshot(selectedTeam),
  }
}

export async function handleChampionBetsRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bolao-Token, Authorization')
    res.end()
    return
  }

  try {
    if (!(await enforceBolaoAccess(req, res))) {
      return
    }

    if (!(await enforceListRateLimit(req, res))) {
      return
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req, MAX_BODY_BYTES)
      const { receipt, bet } = parseChampionBetPayload(body)

      const existingReceiptId = await tryResolveExistingChampionBet(receipt.id, bet)

      if (existingReceiptId) {
        sendJson(res, 200, { receiptId: existingReceiptId })
        return
      }

      const betWithTeam = await prepareChampionBetForStorage(bet)
      const { receiptId, created } = await insertChampionBetAndReceipt(receipt, betWithTeam)

      sendJson(res, created ? 201 : 200, { receiptId })
      return
    }

    if (req.method === 'GET') {
      const parsed = new URL(req.url ?? '', 'http://localhost')
      const receiptIdParam = parsed.searchParams.get('receiptId')

      if (receiptIdParam) {
        let receiptId

        try {
          receiptId = assertSafeReceiptId(receiptIdParam)
        } catch {
          sendJson(res, 400, { message: 'Parâmetro receiptId inválido.' })
          return
        }

        const stored = await findChampionBetByReceiptId(receiptId)

        if (!stored) {
          sendJson(res, 404, { message: 'Comprovante não encontrado.' })
          return
        }

        sendJson(res, 200, {
          id: receiptId,
          generatedAt: stored.generatedAt,
          championBet: {
            teamId: stored.teamId,
            team: stored.team,
            personName: stored.personName,
            createdAt: stored.createdAt,
          },
        })
        return
      }

      const [bets, meta] = await Promise.all([findAllChampionBets(), loadChampionMeta()])
      sendJson(res, 200, { bets, meta })
      return
    }

    sendJson(res, 405, { message: 'Método não permitido.' })
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })
      return
    }

    console.error('[api/champion-bets]', error)

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
