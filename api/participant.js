import { handleParticipantRouterRequest } from '../server/lib/participantRouter.js'

export default async function handler(req, res) {
  await handleParticipantRouterRequest(req, res)
}
