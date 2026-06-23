import { handleParticipantCheckNameRequest } from '../../server/lib/participantHttp.js'

export default async function handler(req, res) {
  await handleParticipantCheckNameRequest(req, res)
}
