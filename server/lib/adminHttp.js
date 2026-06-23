import { deleteBetByReceiptId, findAllBets } from './betDb.js'
import {
  clearSessionCookie,
  createSessionToken,
  isAdminAuthenticated,
  isAdminConfigured,
  revokeAdminSessionFromRequest,
  setSessionCookie,
  verifyAdminPassword,
} from './adminAuth.js'
import {
  clearLoginAttempts,
  formatBlockedMessage,
  getClientIp,
  getLoginBlockStatus,
  recordFailedLogin,
} from './adminLoginRateLimit.js'
import { readJsonBody, sendJson, sendTooManyRequests } from './httpUtils.js'
import { ValidationError, assertSafeReceiptId } from './validateInput.js'
import { isPostgresConfigError, PUBLIC_MESSAGES } from './userFacingErrors.js'

const MAX_BODY_BYTES = 4_096

function sendUnauthorized(res) {
  sendJson(res, 401, { message: 'Acesso não autorizado.' })
}

function sendAdminNotConfigured(res) {
  sendJson(res, 503, {
    message: PUBLIC_MESSAGES.ADMIN_UNAVAILABLE,
  })
}

async function requireAdmin(req, res) {
  if (!isAdminConfigured()) {
    sendAdminNotConfigured(res)
    return false
  }

  if (!(await isAdminAuthenticated(req))) {
    sendUnauthorized(res)
    return false
  }

  return true
}

export async function handleAdminLoginRequest(req, res) {
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

  if (!isAdminConfigured()) {
    sendAdminNotConfigured(res)
    return
  }

  const clientIp = getClientIp(req)
  const blockStatus = await getLoginBlockStatus(clientIp)

  if (blockStatus.blocked) {
    sendTooManyRequests(
      res,
      formatBlockedMessage(blockStatus.retryAfterSeconds),
      blockStatus.retryAfterSeconds,
    )
    return
  }

  try {
    const body = await readJsonBody(req, MAX_BODY_BYTES)
    const password = typeof body.password === 'string' ? body.password : ''

    if (!verifyAdminPassword(password)) {
      const failure = await recordFailedLogin(clientIp)

      if (failure.blocked) {
        sendTooManyRequests(
          res,
          formatBlockedMessage(failure.retryAfterSeconds),
          failure.retryAfterSeconds,
        )
        return
      }

      const remaining = failure.remainingAttempts
      sendJson(res, 401, {
        message: `Senha incorreta. Restam ${remaining} tentativa(s) antes do bloqueio.`,
      })
      return
    }

    await clearLoginAttempts(clientIp)
    const { token, maxAge } = createSessionToken()
    setSessionCookie(res, token, maxAge)
    sendJson(res, 200, { authenticated: true })
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })
      return
    }

    console.error('[api/admin/login]', error)
    sendJson(res, 500, { message: 'Não foi possível realizar o login.' })
  }
}

export async function handleAdminLogoutRequest(req, res) {
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

  await revokeAdminSessionFromRequest(req)
  clearSessionCookie(res)
  sendJson(res, 200, { authenticated: false })
}

export async function handleAdminSessionRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.end()
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  if (!isAdminConfigured()) {
    sendJson(res, 200, { authenticated: false, configured: false, loginBlockedUntil: null })
    return
  }

  const blockStatus = await getLoginBlockStatus(getClientIp(req))

  sendJson(res, 200, {
    authenticated: await isAdminAuthenticated(req),
    configured: true,
    loginBlockedUntil: blockStatus.blocked ? blockStatus.blockedUntil : null,
  })
}

export async function handleAdminBetsRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (!(await requireAdmin(req, res))) return

  try {
    if (req.method === 'GET') {
      const bets = await findAllBets()
      sendJson(res, 200, { bets })
      return
    }

    if (req.method === 'DELETE') {
      const parsed = new URL(req.url ?? '', 'http://localhost')

      if (!parsed.searchParams.has('receiptId')) {
        sendJson(res, 400, { message: 'Parâmetro receiptId é obrigatório.' })
        return
      }

      let receiptId

      try {
        receiptId = assertSafeReceiptId(parsed.searchParams.get('receiptId'))
      } catch {
        sendJson(res, 400, { message: 'Parâmetro receiptId inválido.' })
        return
      }

      const deleted = await deleteBetByReceiptId(receiptId)

      if (!deleted) {
        sendJson(res, 404, { message: 'Palpite não encontrado.' })
        return
      }

      sendJson(res, 200, { deleted: true, receiptId })
      return
    }

    sendJson(res, 405, { message: 'Método não permitido.' })
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(res, 400, { message: error.message })
      return
    }

    console.error('[api/admin/bets]', error)

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
