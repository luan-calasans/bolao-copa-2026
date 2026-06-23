import { handleBetsRequest } from '../server/lib/betsHttp.js'

export default async function handler(req, res) {
  await handleBetsRequest(req, res)
}
