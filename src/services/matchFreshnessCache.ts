import type { Match } from '../models/match'
import { hasKickoffPassed, pickFresherMatch } from '../utils/matchFreshness'

const CACHE_TTL_MS = 10 * 60 * 1000

interface CachedMatchEntry {
  match: Match
  clientFetchedAtMs: number
}

const matchCache = new Map<number, CachedMatchEntry>()

export function rememberMatch(match: Match): void {
  matchCache.set(match.id, {
    match,
    clientFetchedAtMs: Date.now(),
  })
}

export function getRememberedMatch(matchId: number): Match | null {
  const entry = matchCache.get(matchId)
  if (!entry) return null

  if (Date.now() - entry.clientFetchedAtMs > CACHE_TTL_MS) {
    matchCache.delete(matchId)
    return null
  }

  if (hasKickoffPassed(entry.match)) {
    matchCache.delete(matchId)
    return null
  }

  return entry.match
}

export function applyRememberedMatches(matches: Match[]): Match[] {
  return matches.map((match) => {
    const remembered = getRememberedMatch(match.id)
    return remembered ? pickFresherMatch(match, remembered) : match
  })
}
