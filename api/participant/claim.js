import { handleParticipantClaimRequest } from '../../server/lib/participantHttp.js'

export default async function handler(req, res) {
  await handleParticipantClaimRequest(req, res)
}
