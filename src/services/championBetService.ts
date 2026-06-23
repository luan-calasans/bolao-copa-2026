import type {
  ChampionBetEntry,
  ChampionBetPayload,
  ChampionBetsResponse,
  ChampionReceipt,
} from '../models/championBet'
import { resolveApiErrorMessage } from '../utils/errorMessages'
import { noStoreFetch } from '../utils/noStoreFetch'
import { getBolaoAccessHeaders } from './bolaoApiHeaders'
import { invalidateCacheKey, cachedFetch, type FetchCacheOptions } from './requestCache'
import { invalidateParticipantBetItemsCache } from '../utils/participantBetItemsCache'

const CHAMPION_BETS_API_URL = '/api/champion-bets'
const CHAMPION_BETS_CACHE_KEY = 'champion-bets:all'
const CHAMPION_BETS_CACHE_TTL_MS = 20_000

function buildHeaders(extra?: HeadersInit): HeadersInit {
  return {
    ...getBolaoAccessHeaders(),
    ...extra,
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  let serverMessage: string | undefined

  try {
    const body = (await response.json()) as { message?: string }
    serverMessage = body.message
  } catch {
    // ignore parse errors
  }

  return resolveApiErrorMessage(response.status, serverMessage, 'bets')
}

export async function fetchChampionBets(
  options?: FetchCacheOptions,
): Promise<ChampionBetsResponse> {
  return cachedFetch(
    CHAMPION_BETS_CACHE_KEY,
    CHAMPION_BETS_CACHE_TTL_MS,
    async () => {
      const response = await noStoreFetch(CHAMPION_BETS_API_URL, {
        headers: buildHeaders(),
      })

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response))
      }

      return (await response.json()) as ChampionBetsResponse
    },
    options,
  )
}

export async function saveChampionBetAndReceipt(
  bet: ChampionBetPayload,
  receipt: { id: string; generatedAt: string },
): Promise<string> {
  const response = await noStoreFetch(CHAMPION_BETS_API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ bet, receipt }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const body = (await response.json()) as { receiptId: string }
  invalidateCacheKey(CHAMPION_BETS_CACHE_KEY)
  invalidateCacheKey('ranking:all')
  invalidateParticipantBetItemsCache()
  return body.receiptId
}

export async function getChampionReceiptById(receiptId: string): Promise<ChampionReceipt | null> {
  const response = await noStoreFetch(
    `${CHAMPION_BETS_API_URL}?receiptId=${encodeURIComponent(receiptId)}`,
    {
      headers: buildHeaders(),
    },
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as ChampionReceipt
}

export type { ChampionBetEntry, ChampionReceipt }
