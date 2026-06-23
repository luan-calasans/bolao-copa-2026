import { handleAdminBetsRequest } from '../../server/lib/adminHttp.js'

export default async function handler(req, res) {
  await handleAdminBetsRequest(req, res)
}
