import { handleAdminLogoutRequest } from '../../server/lib/adminHttp.js'

export default async function handler(req, res) {
  await handleAdminLogoutRequest(req, res)
}
