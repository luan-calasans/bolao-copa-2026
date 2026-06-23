import { ApiError, resolveApiErrorMessage } from '../utils/errorMessages'
import { noStoreFetch } from '../utils/noStoreFetch'

const API_BASE_URL = '/api/sportsdb'

export async function sportsdbFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams(params)
  const query = searchParams.toString()
  const url = `${API_BASE_URL}/${endpoint}${query ? `?${query}` : ''}`

  let response: Response

  try {
    response = await noStoreFetch(url)
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

  return response.json() as Promise<T>
}
