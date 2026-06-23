import type { ScoringRule } from '../utils/betScoring'
import { ApiError, resolveApiErrorMessage } from '../utils/errorMessages'
import { noStoreFetch } from '../utils/noStoreFetch'
import { cachedFetch, type FetchCacheOptions } from './requestCache'

export interface RankingRow {
  personNameKey: string
  displayName: string
  totalPoints: number
  exactHits: number
  partialHits: number
  missedHits: number
  pendingBets: number
  totalBets: number
  hitRateEfficiency: number | null
}

export interface RankingResponse {
  rules: ScoringRule[]
  ranking: RankingRow[]
  syncedAt: string
}

const RANKING_API_URL = '/api/ranking'
const RANKING_CACHE_KEY = 'ranking:all'
const RANKING_CACHE_TTL_MS = 20_000

export async function fetchRanking(options?: FetchCacheOptions): Promise<RankingResponse> {
  return cachedFetch(
    RANKING_CACHE_KEY,
    RANKING_CACHE_TTL_MS,
    async () => {
      const response = await noStoreFetch(RANKING_API_URL)

      if (!response.ok) {
        let serverMessage: string | undefined

        try {
          const body = (await response.json()) as { message?: string }
          serverMessage = body.message
        } catch {
          // ignore parse errors
        }

        throw new ApiError(
          resolveApiErrorMessage(response.status, serverMessage, 'ranking'),
          response.status,
        )
      }

      return (await response.json()) as RankingResponse
    },
    options,
  )
}
