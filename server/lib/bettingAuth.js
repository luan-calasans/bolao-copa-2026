import { isAdminAuthenticated } from './adminAuth.js'
import { getParticipantSession, isParticipantAuthConfigured } from './participantAuth.js'
import { sendJson } from './httpUtils.js'
import { PUBLIC_MESSAGES } from './userFacingErrors.js'

function sendParticipantAuthNotConfigured(res) {
  sendJson(res, 503, {
    message: 'Autenticação de participantes indisponível. Configure PARTICIPANT_SESSION_SECRET.',
  })
}

function sendParticipantUnauthorized(res) {
  sendJson(res, 401, {
    message: 'Faça login para registrar palpites.',
    code: 'PARTICIPANT_AUTH_REQUIRED',
  })
}

/**
 * Exige sessão de participante ou admin para criar palpites.
 * Admin mantém liberdade total (pode informar qualquer nome no payload).
 * Participante autenticado tem o nome forçado pela sessão.
 */
export async function requireBettingAuth(req, res) {
  if (await isAdminAuthenticated(req)) {
    return { role: 'admin' }
  }

  if (!isParticipantAuthConfigured()) {
    sendParticipantAuthNotConfigured(res)
    return null
  }

  const session = getParticipantSession(req)

  if (!session) {
    sendParticipantUnauthorized(res)
    return null
  }

  return {
    role: 'participant',
    participantId: session.participantId,
    personName: session.personName,
    personNameKey: session.personNameKey,
  }
}

export { PUBLIC_MESSAGES }
