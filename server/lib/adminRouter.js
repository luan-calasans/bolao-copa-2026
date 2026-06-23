import { sendJson } from './httpUtils.js'
import {
  handleAdminBetsRequest,
  handleAdminLoginRequest,
  handleAdminLogoutRequest,
  handleAdminSessionRequest,
} from './adminHttp.js'

function resolveAdminRoute(req) {
  const queryPath = req.query?.path

  if (typeof queryPath === 'string' && queryPath.trim()) {
    return queryPath.trim().replace(/^\/+|\/+$/g, '')
  }

  if (Array.isArray(queryPath) && queryPath.length > 0) {
    return queryPath.join('/')
  }

  const match = (req.url ?? '').match(/^\/api\/admin\/([^?]*)/)

  return match?.[1]?.replace(/\/+$/g, '') ?? ''
}

export async function handleAdminRouterRequest(req, res) {
  const route = resolveAdminRoute(req)

  switch (route) {
    case 'login':
      await handleAdminLoginRequest(req, res)
      return
    case 'logout':
      await handleAdminLogoutRequest(req, res)
      return
    case 'session':
      await handleAdminSessionRequest(req, res)
      return
    case 'bets':
      await handleAdminBetsRequest(req, res)
      return
    default:
      sendJson(res, 404, { message: 'Rota administrativa não encontrada.' })
  }
}
