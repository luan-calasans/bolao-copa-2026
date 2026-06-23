import { handleAdminLoginRequest } from '../../server/lib/adminHttp.js'

export default async function handler(req, res) {
  await handleAdminLoginRequest(req, res)
}
