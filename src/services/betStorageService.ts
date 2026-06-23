import type { Bet } from '../models/bet'
import type { MatchBetEntry } from '../models/matchBet'
import type { Receipt } from '../models/receipt'
import { resolveApiErrorMessage } from '../utils/errorMessages'
import { noStoreFetch } from '../utils/noStoreFetch'
import { getBolaoAccessHeaders } from './bolaoApiHeaders'
import { cachedFetch, invalidateCacheKey, type FetchCacheOptions } from './requestCache'
import { invalidateParticipantBetItemsCache } from '../utils/participantBetItemsCache'

const BETS_API_URL = '/api/bets'
const BETS_CACHE_TTL_MS = 20_000

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

export async function saveBetAndReceipt(bet: Bet, receipt: Receipt): Promise<string> {
  const betPayload = {
    matchId: bet.matchId,
    homeScore: bet.homeScore,
    awayScore: bet.awayScore,
    winnerPick: bet.winnerPick,
    personName: bet.personName,
    createdAt: bet.createdAt,
  }

  const response = await noStoreFetch(BETS_API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ bet: betPayload, receipt }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const body = (await response.json()) as { receiptId: string }
  invalidateCacheKey(`bets:match:${bet.matchId}`)
  invalidateCacheKey('bets:all')
  invalidateCacheKey('ranking:all')
  invalidateParticipantBetItemsCache()
  return body.receiptId
}

export async function getReceiptById(receiptId: string): Promise<Receipt | null> {
  const response = await noStoreFetch(`${BETS_API_URL}?receiptId=${encodeURIComponent(receiptId)}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as Receipt
}

export async function getBetsByMatchId(
  matchId: number,
  options?: FetchCacheOptions,
): Promise<MatchBetEntry[]> {
  return cachedFetch(
    `bets:match:${matchId}`,
    BETS_CACHE_TTL_MS,
    async () => {
      const response = await noStoreFetch(
        `${BETS_API_URL}?matchId=${encodeURIComponent(String(matchId))}`,
      )

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response))
      }

      const body = (await response.json()) as { bets: MatchBetEntry[] }
      return body.bets ?? []
    },
    options,
  )
}

export async function getAllBets(options?: FetchCacheOptions): Promise<MatchBetEntry[]> {
  return cachedFetch(
    'bets:all',
    BETS_CACHE_TTL_MS,
    async () => {
      const response = await noStoreFetch(BETS_API_URL, {
        headers: buildHeaders(),
      })

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response))
      }

      const body = (await response.json()) as { bets: MatchBetEntry[] }
      return body.bets ?? []
    },
    options,
  )
}
