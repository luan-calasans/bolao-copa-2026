import type { MatchBetEntry } from '../models/matchBet'

const ADMIN_BETS_URL = '/api/admin/bets'

const adminFetchInit: RequestInit = {
  credentials: 'include',
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string }
    return body.message ?? 'Não foi possível acessar os palpites.'
  } catch {
    return 'Não foi possível acessar os palpites.'
  }
}

export async function getAdminBets(): Promise<MatchBetEntry[]> {
  const response = await fetch(ADMIN_BETS_URL, adminFetchInit)

  if (response.status === 401) {
    throw new Error('Sessão administrativa expirada. Faça login novamente.')
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const body = (await response.json()) as { bets: MatchBetEntry[] }
  return body.bets ?? []
}

export async function deleteAdminBetByReceiptId(receiptId: string): Promise<void> {
  const response = await fetch(`${ADMIN_BETS_URL}?receiptId=${encodeURIComponent(receiptId)}`, {
    ...adminFetchInit,
    method: 'DELETE',
  })

  if (response.status === 401) {
    throw new Error('Sessão administrativa expirada. Faça login novamente.')
  }

  if (response.status === 404) {
    throw new Error('Palpite não encontrado.')
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
}
