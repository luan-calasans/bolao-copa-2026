import { handleParticipantSessionRequest } from '../../server/lib/participantHttp.js'

export default async function handler(req, res) {
  await handleParticipantSessionRequest(req, res)
}
