import { sendJson } from './httpUtils.js'
import {
  handleParticipantCheckNameRequest,
  handleParticipantClaimRequest,
  handleParticipantBetsRequest,
  handleParticipantLoginRequest,
  handleParticipantLogoutRequest,
  handleParticipantRegisterRequest,
  handleParticipantSessionRequest,
  handleParticipantUnclaimedRequest,
} from './participantHttp.js'

function resolveParticipantRoute(req) {
  const queryPath = req.query?.path

  if (typeof queryPath === 'string' && queryPath.trim()) {
    return queryPath.trim().replace(/^\/+|\/+$/g, '')
  }

  if (Array.isArray(queryPath) && queryPath.length > 0) {
    return queryPath.join('/')
  }

  const match = (req.url ?? '').match(/^\/api\/participant\/([^?]*)/)

  return match?.[1]?.replace(/\/+$/g, '') ?? ''
}

export async function handleParticipantRouterRequest(req, res) {
  const route = resolveParticipantRoute(req)

  switch (route) {
    case 'login':
      await handleParticipantLoginRequest(req, res)
      return
    case 'register':
      await handleParticipantRegisterRequest(req, res)
      return
    case 'claim':
      await handleParticipantClaimRequest(req, res)
      return
    case 'logout':
      await handleParticipantLogoutRequest(req, res)
      return
    case 'session':
      await handleParticipantSessionRequest(req, res)
      return
    case 'unclaimed':
      await handleParticipantUnclaimedRequest(req, res)
      return
    case 'check-name':
      await handleParticipantCheckNameRequest(req, res)
      return
    case 'bets':
      await handleParticipantBetsRequest(req, res)
      return
    default:
      sendJson(res, 404, { message: 'Rota de participante não encontrada.' })
  }
}
