import type { ApiTeamDetail, ApiTeamMatchesResponse } from '../models/api.types'
import type { Match } from '../models/match'
import { mapApiMatchesToMatches } from '../utils/matchMapper'
import { areMatchTeamsDefined } from '../utils/teamDisplay'
import { apiFetch } from './footballApiClient'
import { WORLD_CUP_SEASON } from './footballConstants'

export async function fetchTeamById(teamId: number): Promise<ApiTeamDetail> {
  return apiFetch<ApiTeamDetail>(`/teams/${teamId}`)
}

export interface FetchTeamMatchesOptions {
  season?: string
  status?: string
  limit?: number
}

export async function fetchTeamMatches(
  teamId: number,
  options: FetchTeamMatchesOptions = {},
): Promise<ApiTeamMatchesResponse> {
  const params = new URLSearchParams()

  if (options.season) {
    params.set('season', options.season)
  } else {
    params.set('season', WORLD_CUP_SEASON)
  }

  if (options.status) {
    params.set('status', options.status)
  }

  if (options.limit != null) {
    params.set('limit', String(options.limit))
  }

  const query = params.toString()

  return apiFetch<ApiTeamMatchesResponse>(`/teams/${teamId}/matches?${query}`)
}

export async function fetchTeamMatchesMapped(
  teamId: number,
  options: FetchTeamMatchesOptions = {},
): Promise<Match[]> {
  const response = await fetchTeamMatches(teamId, options)
  return mapApiMatchesToMatches(response.matches ?? []).filter(areMatchTeamsDefined)
}
