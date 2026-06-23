import { handleRankingRequest } from '../server/lib/rankingHttp.js'

export default function handler(req, res) {
  return handleRankingRequest(req, res)
}
