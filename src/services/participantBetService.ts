import { invalidateParticipantBetItemsCache } from '../utils/participantBetItemsCache'
import { invalidateCacheKey } from './requestCache'

const PARTICIPANT_BETS_URL = '/api/participant/bets'

const participantFetchInit: RequestInit = {
  credentials: 'include',
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string }
    return body.message ?? 'Não foi possível excluir o palpite.'
  } catch {
    return 'Não foi possível excluir o palpite.'
  }
}

export async function deleteParticipantBetByReceiptId(receiptId: string): Promise<void> {
  const response = await fetch(
    `${PARTICIPANT_BETS_URL}?receiptId=${encodeURIComponent(receiptId)}`,
    {
      ...participantFetchInit,
      method: 'DELETE',
    },
  )

  if (response.status === 401) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (response.status === 403) {
    throw new Error(await parseErrorMessage(response))
  }

  if (response.status === 404) {
    throw new Error('Palpite não encontrado.')
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  invalidateCacheKey('bets:all')
  invalidateCacheKey('ranking:all')
  invalidateParticipantBetItemsCache()
}
