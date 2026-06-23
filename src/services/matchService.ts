import type { Match } from '../models/match'
import type { ApiMatch, ApiMatchesResponse } from '../models/api.types'
import {
  mapApiMatchToMatch,
  mapApiMatchesToMatches,
  sortAllMatchesChronologically,
} from '../utils/matchMapper'
import {
  hasKickoffPassed,
  mergeMatchesWithOverrides,
  upliftKickoffPassedMatches,
} from '../utils/matchFreshness'
import { areMatchTeamsDefined } from '../utils/teamDisplay'
import { ApiError } from '../utils/errorMessages'
import { apiFetch } from './footballApiClient'
import { WORLD_CUP_MATCHES_API_PATH } from './footballConstants'
import { applyRememberedMatches, getRememberedMatch, rememberMatch } from './matchFreshnessCache'
import { cachedFetch, type FetchCacheOptions } from './requestCache'

export interface WorldCupMatchesBundle {
  matches: Match[]
  undefinedMatches: Match[]
  fetchedAt: string
}

const WORLD_CUP_BUNDLE_CACHE_KEY = 'football:wc-matches-bundle'
const WORLD_CUP_BUNDLE_TTL_MS = 20_000
const MATCH_BY_ID_TTL_MS = 20_000

function matchByIdCacheKey(matchId: number): string {
  return `football:match:${matchId}`
}

function shouldVerifyIndividually(match: Match): boolean {
  if (hasKickoffPassed(match)) {
    return true
  }

  if (!match.isLive) {
    return false
  }

  return match.minute == null && !match.lastUpdated
}

async function fetchMatchByIdFromApi(matchId: number): Promise<Match | null> {
  try {
    const apiMatch = await apiFetch<ApiMatch>(`/matches/${matchId}`)
    const match = mapApiMatchToMatch(apiMatch)
    return match
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }

    throw error
  }
}

async function reconcileStaleMatches(matches: Match[]): Promise<Match[]> {
  const idsToVerify = new Set<number>()

  for (const match of matches) {
    if (shouldVerifyIndividually(match)) {
      idsToVerify.add(match.id)
    }
  }

  if (idsToVerify.size === 0) {
    return matches
  }

  const verifiedMatches = await Promise.all(
    [...idsToVerify].map(async (matchId) => {
      try {
        return await fetchMatchByIdFromApi(matchId)
      } catch {
        return null
      }
    }),
  )

  const overrides = new Map<number, Match>()
  for (const match of verifiedMatches) {
    if (match) {
      rememberMatch(match)
      overrides.set(match.id, match)
    }
  }

  if (overrides.size === 0) {
    return matches
  }

  return mergeMatchesWithOverrides(matches, overrides)
}

async function loadWorldCupMatchesBundle(): Promise<WorldCupMatchesBundle> {
  const response = await apiFetch<ApiMatchesResponse>(WORLD_CUP_MATCHES_API_PATH, {
    priority: 'high',
  })

  const apiMatches = response.matches ?? []
  const mappedMatches = mapApiMatchesToMatches(apiMatches)
  const undefinedMatches = sortAllMatchesChronologically(
    mappedMatches.filter((match) => !areMatchTeamsDefined(match)),
  )
  let matches = mappedMatches.filter(areMatchTeamsDefined)
  matches = await reconcileStaleMatches(matches)
  matches = applyRememberedMatches(matches)
  matches = upliftKickoffPassedMatches(matches)

  for (const match of matches) {
    rememberMatch(match)
  }

  return {
    matches,
    undefinedMatches,
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchWorldCupMatchesBundle(
  options?: FetchCacheOptions,
): Promise<WorldCupMatchesBundle> {
  return cachedFetch(
    WORLD_CUP_BUNDLE_CACHE_KEY,
    WORLD_CUP_BUNDLE_TTL_MS,
    loadWorldCupMatchesBundle,
    options,
  )
}

export async function fetchWorldCupMatches(options?: FetchCacheOptions): Promise<Match[]> {
  const { matches } = await fetchWorldCupMatchesBundle(options)
  return matches
}

/** Includes knockout placeholders (teams ainda não definidos). */
export async function fetchWorldCupMatchesForKnockout(
  options?: FetchCacheOptions,
): Promise<Match[]> {
  const bundle = await fetchWorldCupMatchesBundle(options)
  return [...bundle.matches, ...bundle.undefinedMatches]
}

function findMatchInBundle(bundle: WorldCupMatchesBundle, matchId: number): Match | null {
  return (
    bundle.matches.find((match) => match.id === matchId) ??
    bundle.undefinedMatches.find((match) => match.id === matchId) ??
    null
  )
}

export async function fetchMatchById(
  matchId: number,
  options?: FetchCacheOptions,
): Promise<Match | null> {
  if (!options?.force) {
    const remembered = getRememberedMatch(matchId)
    if (remembered) {
      return remembered
    }
  }

  const bundle = await fetchWorldCupMatchesBundle(options)
  const fromBundle = findMatchInBundle(bundle, matchId)
  if (fromBundle && !shouldVerifyIndividually(fromBundle)) {
    rememberMatch(fromBundle)
    return fromBundle
  }

  const match = await cachedFetch(
    matchByIdCacheKey(matchId),
    MATCH_BY_ID_TTL_MS,
    () => fetchMatchByIdFromApi(matchId),
    options,
  )

  if (match) {
    rememberMatch(match)
  }

  return match
}

export function findWorldCupMatchById(
  matchId: number,
  bundle: WorldCupMatchesBundle,
): Match | null {
  return findMatchInBundle(bundle, matchId)
}
