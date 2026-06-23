import { describe, expect, it, vi } from 'vitest'
import { cachedFetch, invalidateCacheKey } from './requestCache'

describe('requestCache', () => {
  it('deduplicates concurrent requests for the same key', async () => {
    const fetcher = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return 'value'
    })

    const [first, second] = await Promise.all([
      cachedFetch('demo', 1_000, fetcher),
      cachedFetch('demo', 1_000, fetcher),
    ])

    expect(first).toBe('value')
    expect(second).toBe('value')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('returns cached value within ttl', async () => {
    const fetcher = vi.fn(async () => 'fresh')

    await cachedFetch('demo-ttl', 1_000, fetcher)
    const cached = await cachedFetch('demo-ttl', 1_000, fetcher)

    expect(cached).toBe('fresh')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('bypasses cache when force is true', async () => {
    const fetcher = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)

    await cachedFetch('demo-force', 60_000, fetcher)
    const forced = await cachedFetch('demo-force', 60_000, fetcher, { force: true })

    expect(forced).toBe(2)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('invalidates a cache key', async () => {
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')

    await cachedFetch('demo-invalidate', 60_000, fetcher)
    invalidateCacheKey('demo-invalidate')
    const next = await cachedFetch('demo-invalidate', 60_000, fetcher)

    expect(next).toBe('second')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
