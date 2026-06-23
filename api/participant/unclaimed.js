import { handleParticipantUnclaimedRequest } from '../../server/lib/participantHttp.js'

export default async function handler(req, res) {
  await handleParticipantUnclaimedRequest(req, res)
}
