import { ApiError, resolveApiErrorMessage } from '../utils/errorMessages'
import { noStoreFetch } from '../utils/noStoreFetch'

const API_BASE_URL = '/api/football'

type FetchPriority = 'high' | 'low' | 'auto'

interface ApiFetchOptions {
  priority?: FetchPriority
}

export async function apiFetch<T>(endpoint: string, options?: ApiFetchOptions): Promise<T> {
  let response: Response

  try {
    response = await noStoreFetch(`${API_BASE_URL}${endpoint}`, {
      priority: options?.priority,
    })
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

    throw new ApiError(
      resolveApiErrorMessage(response.status, serverMessage, 'football'),
      response.status,
    )
  }

  return response.json() as Promise<T>
}
