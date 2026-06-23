import { handleFootballProxyRequest } from '../server/lib/footballProxyHttp.js'

export default async function handler(req, res) {
  await handleFootballProxyRequest(req, res)
}
