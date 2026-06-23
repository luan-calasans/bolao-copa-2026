import type { AiPrediction } from '../models/aiPrediction'
import { ApiError, resolveApiErrorMessage } from '../utils/errorMessages'

export async function fetchAiPrediction(matchId: number): Promise<AiPrediction> {
  let response: Response

  try {
    response = await fetch(`/api/ai-predict?matchId=${matchId}`)
  } catch {
    throw new ApiError(
      'Sem conexão com a internet. Verifique sua rede e tente novamente.',
      undefined,
      true,
    )
  }

  if (!response.ok) {
    let serverMessage: string | undefined

    try {
      const body = (await response.json()) as { message?: string }
      serverMessage = body.message
    } catch {
      // ignore parse errors
    }

    throw new ApiError(resolveApiErrorMessage(response.status, serverMessage, 'generic'), response.status)
  }

  return response.json() as Promise<AiPrediction>
}
