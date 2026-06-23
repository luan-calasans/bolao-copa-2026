import { handleSportsdbProxyRequest } from '../server/lib/sportsdbProxyHttp.js'

export default async function handler(req, res) {
  await handleSportsdbProxyRequest(req, res)
}
