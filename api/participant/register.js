import { handleParticipantRegisterRequest } from '../../server/lib/participantHttp.js'

export default async function handler(req, res) {
  await handleParticipantRegisterRequest(req, res)
}
