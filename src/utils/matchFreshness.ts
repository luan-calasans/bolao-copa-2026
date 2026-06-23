import type { Match } from '../models/match'

export function parseLastUpdatedMs(lastUpdated: string | null | undefined): number | null {
  if (!lastUpdated) return null
  const ms = Date.parse(lastUpdated)
  return Number.isNaN(ms) ? null : ms
}

function getMatchStatusPriority(match: Match): number {
  if (match.status === 'finished') return 3
  if (match.isLive || match.status === 'live') return 2
  if (match.status === 'scheduled') return 1
  return 0
}

/** Prefers the match with the more up-to-date status (e.g. live → finished). */
export function pickFresherMatch(bulk: Match, candidate: Match): Match {
  const bulkPriority = getMatchStatusPriority(bulk)
  const candidatePriority = getMatchStatusPriority(candidate)

  if (candidatePriority !== bulkPriority) {
    return candidatePriority > bulkPriority ? candidate : bulk
  }

  const bulkUpdated = parseLastUpdatedMs(bulk.lastUpdated)
  const candidateUpdated = parseLastUpdatedMs(candidate.lastUpdated)

  if (bulkUpdated != null && candidateUpdated != null) {
    return candidateUpdated >= bulkUpdated ? candidate : bulk
  }

  return candidate
}

export function mergeMatchesWithOverrides(
  matches: Match[],
  overrides: ReadonlyMap<number, Match>,
): Match[] {
  return matches.map((match) => {
    const override = overrides.get(match.id)
    return override ? pickFresherMatch(match, override) : match
  })
}

export function hasKickoffPassed(match: Match, nowMs = Date.now()): boolean {
  if (match.status !== 'scheduled' || match.isLive) {
    return false
  }

  const kickoffMs = Date.parse(match.utcDate)
  return !Number.isNaN(kickoffMs) && nowMs >= kickoffMs
}

/** When the API still lists a started match as scheduled, show it as live until a fresher status arrives. */
export function upliftKickoffPassedMatch(match: Match, nowMs = Date.now()): Match {
  if (!hasKickoffPassed(match, nowMs)) {
    return match
  }

  return {
    ...match,
    status: 'live',
    rawStatus: 'IN_PLAY',
    isLive: true,
  }
}

export function upliftKickoffPassedMatches(matches: Match[], nowMs = Date.now()): Match[] {
  return matches.map((match) => upliftKickoffPassedMatch(match, nowMs))
}
