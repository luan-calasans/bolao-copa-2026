import { SPORTSDB_BASE_URL, getSportsdbApiKey } from './sportsdbConstants.js'
import { isAllowedSportsdbEndpoint } from './sportsdbProxyAllowlist.js'
import { checkRateLimit, getClientIp, sendRateLimitResponse } from './rateLimit.js'
import { sendJson } from './httpUtils.js'

const PROXY_RATE_LIMIT = 30
const PROXY_RATE_WINDOW_MS = 60_000
const UPSTREAM_TIMEOUT_MS = 25_000

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

function getEndpointFromRequest(req) {
  const parsed = new URL(req.url ?? '', 'http://localhost')

  if (parsed.searchParams.has('path')) {
    const slug = parsed.searchParams.get('path')
    return Array.isArray(slug) ? slug.join('/') : slug || ''
  }

  return parsed.pathname.replace(/^\/api\/sportsdb\/?/, '')
}

function getQueryFromRequest(req) {
  const parsed = new URL(req.url ?? '', 'http://localhost')
  const query = Object.fromEntries(parsed.searchParams.entries())
  delete query.path
  return query
}

export async function handleSportsdbProxyRequest(req, res) {
  const method = req.method ?? 'GET'

  if (method !== 'GET' && method !== 'HEAD') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  const endpoint = getEndpointFromRequest(req)

  if (!isAllowedSportsdbEndpoint(endpoint)) {
    sendJson(res, 403, { message: 'Endpoint não permitido.' })
    return
  }

  const clientIp = getClientIp(req)
  const rateLimit = await checkRateLimit({
    key: `sportsdb-proxy:${clientIp}`,
    limit: PROXY_RATE_LIMIT,
    windowMs: PROXY_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendRateLimitResponse(
      res,
      'Muitas requisições à API de gols. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return
  }

  const apiKey = getSportsdbApiKey()
  const query = buildQuery(getQueryFromRequest(req))

  try {
    const upstream = await fetch(`${SPORTSDB_BASE_URL}/${apiKey}/${endpoint}${query}`, {
      method,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })

    res.statusCode = upstream.status
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    if (method === 'HEAD') {
      res.end()
      return
    }

    const body = await upstream.text()
    res.end(body)
  } catch (error) {
    console.error('[api/sportsdb-proxy]', error)

    sendJson(res, 502, {
      message: 'Não foi possível consultar os gols agora. Tente novamente em alguns minutos.',
    })
  }
}
