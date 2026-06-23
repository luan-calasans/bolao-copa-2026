import { handleAdminRouterRequest } from '../server/lib/adminRouter.js'

export default async function handler(req, res) {
  await handleAdminRouterRequest(req, res)
}
