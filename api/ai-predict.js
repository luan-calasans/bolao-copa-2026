import { handleAiPredictRequest } from '../server/lib/aiPredictHttp.js'

export default async function handler(req, res) {
  await handleAiPredictRequest(req, res)
}
