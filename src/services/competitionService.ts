import type {
  ApiCompetition,
  ApiCompetitionsResponse,
  ApiScorersResponse,
  ApiStandingsResponse,
  ApiTeamsResponse,
} from '../models/api.types'
import { apiFetch } from './footballApiClient'
import { WORLD_CUP_CODE, WORLD_CUP_SEASON } from './footballConstants'
import { cachedFetch, type FetchCacheOptions } from './requestCache'

const COMPETITION_CACHE_TTL_MS = 20_000

function competitionTeamsCacheKey(competitionId: string | number, season: number | string): string {
  return `football:competition:${competitionId}:teams:${season}`
}

function competitionStandingsCacheKey(
  competitionId: string | number,
  season: number | string,
): string {
  return `football:competition:${competitionId}:standings:${season}`
}

function competitionScorersCacheKey(
  competitionId: string | number,
  season: number | string,
): string {
  return `football:competition:${competitionId}:scorers:${season}`
}

export async function fetchCompetitions(): Promise<ApiCompetition[]> {
  const response = await apiFetch<ApiCompetitionsResponse>('/competitions')
  return response.competitions ?? []
}

export async function fetchCompetitionTeams(
  competitionId: string | number,
  season = WORLD_CUP_SEASON,
  options?: FetchCacheOptions,
): Promise<ApiTeamsResponse> {
  return cachedFetch(
    competitionTeamsCacheKey(competitionId, season),
    COMPETITION_CACHE_TTL_MS,
    () => apiFetch<ApiTeamsResponse>(`/competitions/${competitionId}/teams?season=${season}`),
    options,
  )
}

export async function fetchWorldCupTeams(
  season = WORLD_CUP_SEASON,
  options?: FetchCacheOptions,
): Promise<ApiTeamsResponse> {
  return fetchCompetitionTeams(WORLD_CUP_CODE, season, options)
}

export async function fetchCompetitionStandings(
  competitionId: string | number,
  season = WORLD_CUP_SEASON,
  options?: FetchCacheOptions,
): Promise<ApiStandingsResponse> {
  return cachedFetch(
    competitionStandingsCacheKey(competitionId, season),
    COMPETITION_CACHE_TTL_MS,
    () =>
      apiFetch<ApiStandingsResponse>(
        `/competitions/${competitionId}/standings?season=${season}`,
      ),
    options,
  )
}

export async function fetchWorldCupStandings(
  season = WORLD_CUP_SEASON,
  options?: FetchCacheOptions,
): Promise<ApiStandingsResponse> {
  return fetchCompetitionStandings(WORLD_CUP_CODE, season, options)
}

export async function fetchCompetitionScorers(
  competitionId: string | number,
  season = WORLD_CUP_SEASON,
  options?: FetchCacheOptions,
): Promise<ApiScorersResponse> {
  return cachedFetch(
    competitionScorersCacheKey(competitionId, season),
    COMPETITION_CACHE_TTL_MS,
    () =>
      apiFetch<ApiScorersResponse>(`/competitions/${competitionId}/scorers?season=${season}`),
    options,
  )
}

export async function fetchWorldCupScorers(
  season = WORLD_CUP_SEASON,
  options?: FetchCacheOptions,
): Promise<ApiScorersResponse> {
  return fetchCompetitionScorers(WORLD_CUP_CODE, season, options)
}
