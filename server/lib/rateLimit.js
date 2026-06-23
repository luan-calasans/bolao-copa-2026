/** @type {Map<string, { count: number, resetAt: number }>} */
const memoryStore = new Map()

export function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for']

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].trim()
  }

  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown'
}

function pruneMemoryStore(now) {
  if (memoryStore.size < 500) return

  for (const [key, entry] of memoryStore.entries()) {
    if (now >= entry.resetAt) {
      memoryStore.delete(key)
    }
  }
}

function buildRateLimitResult(entry, limit, now) {
  if (!entry) {
    return {
      limited: false,
      remaining: limit,
      count: 0,
    }
  }

  if (entry.count > limit) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      count: entry.count,
    }
  }

  return {
    limited: false,
    remaining: Math.max(0, limit - entry.count),
    count: entry.count,
  }
}

function memoryPeekRateLimit(key, limit) {
  const now = Date.now()
  pruneMemoryStore(now)

  const entry = memoryStore.get(key)
  if (!entry || now >= entry.resetAt) {
    return buildRateLimitResult(null, limit, now)
  }

  return buildRateLimitResult(entry, limit, now)
}

function memoryRateLimit(key, limit, windowMs) {
  const now = Date.now()
  pruneMemoryStore(now)

  let entry = memoryStore.get(key)

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
  }

  entry.count += 1
  memoryStore.set(key, entry)

  return buildRateLimitResult(entry, limit, now)
}

function memoryClearRateLimit(key) {
  memoryStore.delete(key)
}

async function upstashPeekRateLimit(key, limit) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    return null
  }

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['GET', key],
        ['TTL', key],
      ]),
    })

    if (!response.ok) {
      return null
    }

    const results = await response.json()
    const count = Number(results[0]?.result ?? 0)
    const ttl = Number(results[1]?.result ?? -1)

    if (!count || ttl <= 0) {
      return {
        limited: false,
        remaining: limit,
        count: 0,
      }
    }

    if (count > limit) {
      return {
        limited: true,
        retryAfterSeconds: Math.max(1, ttl),
        count,
      }
    }

    return {
      limited: false,
      remaining: Math.max(0, limit - count),
      count,
    }
  } catch {
    return null
  }
}

async function upstashClearRateLimit(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    return false
  }

  try {
    const response = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return response.ok
  } catch {
    return false
  }
}

async function upstashRateLimit(key, limit, windowSec) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    return null
  }

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['TTL', key],
      ]),
    })

    if (!response.ok) {
      return null
    }

    const results = await response.json()
    const count = Number(results[0]?.result ?? 0)
    let ttl = Number(results[1]?.result ?? -1)

    if (ttl === -1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSec}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      ttl = windowSec
    }

    return buildRateLimitResult(
      { count, resetAt: Date.now() + Math.max(1, ttl) * 1000 },
      limit,
      Date.now(),
    )
  } catch {
    return null
  }
}

/**
 * @param {{ key: string, limit: number }} options
 */
export async function peekRateLimit({ key, limit }) {
  const distributed = await upstashPeekRateLimit(key, limit)

  if (distributed) {
    return distributed
  }

  return memoryPeekRateLimit(key, limit)
}

/**
 * @param {{ key: string, limit: number, windowMs: number }} options
 */
export async function checkRateLimit({ key, limit, windowMs }) {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
  const distributed = await upstashRateLimit(key, limit, windowSec)

  if (distributed) {
    return distributed
  }

  return memoryRateLimit(key, limit, windowMs)
}

export async function clearRateLimit(key) {
  const cleared = await upstashClearRateLimit(key)
  memoryClearRateLimit(key)
  return cleared
}

export function sendRateLimitResponse(res, message, retryAfterSeconds) {
  res.statusCode = 429
  res.setHeader('Retry-After', String(retryAfterSeconds))
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ message, retryAfterSeconds }))
}
