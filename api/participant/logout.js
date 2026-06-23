import { handleParticipantLogoutRequest } from '../../server/lib/participantHttp.js'

export default async function handler(req, res) {
  await handleParticipantLogoutRequest(req, res)
}
