import { handleChampionBetsRequest } from '../server/lib/championBetsHttp.js'

export default async function handler(req, res) {
  await handleChampionBetsRequest(req, res)
}
