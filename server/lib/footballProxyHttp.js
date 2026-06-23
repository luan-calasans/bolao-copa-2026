import { isAllowedFootballPath } from './footballProxyAllowlist.js'
import { getFootballToken } from './footballToken.js'
import { checkRateLimit, getClientIp, sendRateLimitResponse } from './rateLimit.js'
import { sendJson } from './httpUtils.js'
import { PUBLIC_MESSAGES } from './userFacingErrors.js'

const PROXY_RATE_LIMIT = 30
const PROXY_RATE_WINDOW_MS = 60_000

function buildQuery(query) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (key === 'path') continue

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
    } else if (value !== undefined) {
      params.append(key, value)
    }
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function getApiPathFromRequest(req) {
  const parsed = new URL(req.url ?? '', 'http://localhost')

  if (parsed.searchParams.has('path')) {
    const slug = parsed.searchParams.get('path')
    return Array.isArray(slug) ? slug.join('/') : slug || ''
  }

  return parsed.pathname.replace(/^\/api\/football\/?/, '')
}

function getQueryFromRequest(req) {
  const parsed = new URL(req.url ?? '', 'http://localhost')
  const query = Object.fromEntries(parsed.searchParams.entries())
  delete query.path
  return query
}

const UPSTREAM_TIMEOUT_MS = 25_000

export async function handleFootballProxyRequest(req, res) {
  const method = req.method ?? 'GET'

  if (method !== 'GET' && method !== 'HEAD') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  const apiPath = getApiPathFromRequest(req)

  if (!isAllowedFootballPath(apiPath)) {
    sendJson(res, 403, { message: 'Endpoint não permitido.' })
    return
  }

  const clientIp = getClientIp(req)
  const rateLimit = await checkRateLimit({
    key: `football-proxy:${clientIp}`,
    limit: PROXY_RATE_LIMIT,
    windowMs: PROXY_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendRateLimitResponse(
      res,
      'Muitas requisições à API de futebol. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return
  }

  const token = getFootballToken()

  if (!token) {
    sendJson(res, 503, {
      message: PUBLIC_MESSAGES.FOOTBALL_UNAVAILABLE,
    })
    return
  }

  const query = buildQuery(getQueryFromRequest(req))

  try {
    const upstream = await fetch(`https://api.football-data.org/v4/${apiPath}${query}`, {
      method,
      headers: {
        'X-Auth-Token': token,
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })

    res.statusCode = upstream.status
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')

    if (upstream.ok) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }

    if (method === 'HEAD') {
      res.end()
      return
    }

    const body = await upstream.text()
    res.end(body)
  } catch (error) {
    console.error('[api/football-proxy]', error)

    const message =
      error instanceof Error && error.name === 'TimeoutError'
        ? PUBLIC_MESSAGES.FOOTBALL_TIMEOUT
        : PUBLIC_MESSAGES.FOOTBALL_UNAVAILABLE

    sendJson(res, 502, { message })
  }
}
