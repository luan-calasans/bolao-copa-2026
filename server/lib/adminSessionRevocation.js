/** @type {Map<string, number>} */
const revokedUntil = new Map()

function pruneRevokedSessions() {
  const now = Math.floor(Date.now() / 1000)

  for (const [jti, expiresAt] of revokedUntil.entries()) {
    if (expiresAt <= now) {
      revokedUntil.delete(jti)
    }
  }
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    return null
  }

  return { url, token }
}

export async function revokeAdminSession(jti, expiresAtSec) {
  if (!jti) return

  const ttlSec = Math.max(1, expiresAtSec - Math.floor(Date.now() / 1000))
  revokedUntil.set(jti, expiresAtSec)

  const upstash = getUpstashConfig()
  if (!upstash) return

  try {
    await fetch(`${upstash.url}/set/${encodeURIComponent(`admin-revoked:${jti}`)}/1/EX/${ttlSec}`, {
      headers: { Authorization: `Bearer ${upstash.token}` },
    })
  } catch {
    // in-memory fallback already recorded
  }
}

export async function isAdminSessionRevoked(jti) {
  if (!jti) return true

  pruneRevokedSessions()

  const localExpiry = revokedUntil.get(jti)
  if (localExpiry && localExpiry > Math.floor(Date.now() / 1000)) {
    return true
  }

  const upstash = getUpstashConfig()
  if (!upstash) {
    return false
  }

  try {
    const response = await fetch(
      `${upstash.url}/get/${encodeURIComponent(`admin-revoked:${jti}`)}`,
      {
        headers: { Authorization: `Bearer ${upstash.token}` },
      },
    )

    if (!response.ok) {
      return false
    }

    const body = await response.json()
    return body.result != null
  } catch {
    return false
  }
}
