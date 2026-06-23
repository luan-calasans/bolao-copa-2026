function withCacheBust(url: string): string {
  const parsed = new URL(url, window.location.origin)
  parsed.searchParams.set('_', String(Date.now()))
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

export function noStoreFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(withCacheBust(input), {
    ...init,
    cache: 'no-store',
  })
}
