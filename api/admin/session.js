import { handleAdminSessionRequest } from '../../server/lib/adminHttp.js'

export default async function handler(req, res) {
  await handleAdminSessionRequest(req, res)
}
