export interface FetchCacheOptions {
  force?: boolean
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export function invalidateCacheKey(key: string): void {
  cache.delete(key)
  inflight.delete(key)
}

export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }

  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) {
      inflight.delete(key)
    }
  }
}

export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options?: FetchCacheOptions,
): Promise<T> {
  if (!options?.force) {
    const entry = cache.get(key) as CacheEntry<T> | undefined
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value
    }

    const pending = inflight.get(key) as Promise<T> | undefined
    if (pending) {
      return pending
    }
  } else {
    inflight.delete(key)
  }

  const promise = fetcher()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs })
      inflight.delete(key)
      return value
    })
    .catch((error) => {
      inflight.delete(key)
      throw error
    })

  inflight.set(key, promise)
  return promise
}
