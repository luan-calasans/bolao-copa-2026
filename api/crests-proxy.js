import { isAllowedCrestPath } from '../server/lib/footballProxyAllowlist.js'
import { checkRateLimit, getClientIp, sendRateLimitResponse } from '../server/lib/rateLimit.js'

const CREST_RATE_LIMIT = 60
const CREST_RATE_WINDOW_MS = 60_000

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { message: 'Método não permitido.' })
    return
  }

  const slug = req.query.path
  const apiPath = Array.isArray(slug) ? slug.join('/') : slug || ''

  if (!isAllowedCrestPath(apiPath)) {
    sendJson(res, 403, { message: 'Recurso não permitido.' })
    return
  }

  const rateLimit = await checkRateLimit({
    key: `crests-proxy:${getClientIp(req)}`,
    limit: CREST_RATE_LIMIT,
    windowMs: CREST_RATE_WINDOW_MS,
  })

  if (rateLimit.limited) {
    sendRateLimitResponse(
      res,
      'Muitas requisições de escudos. Tente novamente em instantes.',
      rateLimit.retryAfterSeconds ?? 60,
    )
    return
  }

  try {
    const upstream = await fetch(`https://crests.football-data.org/${apiPath}`, {
      method: req.method,
    })

    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    res.send(Buffer.from(await upstream.arrayBuffer()))
  } catch {
    sendJson(res, 502, { message: 'Não foi possível carregar o escudo.' })
  }
}
