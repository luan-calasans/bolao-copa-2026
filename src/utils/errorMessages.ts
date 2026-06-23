const TECHNICAL_MESSAGE_PATTERN =
  /POSTGRES|FOOTBALL_API|BOLAO_ACCESS|ADMIN_|VITE_|GEMINI_API|GOOGLE_API|XAI_API|Vercel|\.env|vari[aá]vel de ambiente|Environment Variables|redeploy|Settings\s*→/i

export type ApiErrorContext = 'bets' | 'football' | 'ranking' | 'generic'

export class ApiError extends Error {
  readonly statusCode?: number
  readonly isNetworkError: boolean

  constructor(message: string, statusCode?: number, isNetworkError = false) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.isNetworkError = isNetworkError
  }
}

export interface LoadError {
  message: string
  statusCode?: number
}

export function isTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_MESSAGE_PATTERN.test(message)
}

export function resolveApiErrorMessage(
  status: number,
  serverMessage?: string,
  context: ApiErrorContext = 'generic',
): string {
  if (
    serverMessage &&
    (status === 400 || status === 409 || status === 422 || status === 503) &&
    !isTechnicalErrorMessage(serverMessage)
  ) {
    return serverMessage
  }

  if (serverMessage && status === 429 && !isTechnicalErrorMessage(serverMessage)) {
    return serverMessage
  }

  switch (status) {
    case 401:
    case 403:
      if (context === 'bets') {
        return 'Não foi possível carregar os palpites no momento.'
      }
      if (context === 'football') {
        return 'Não foi possível carregar os jogos no momento.'
      }
      return 'Não foi possível carregar os dados no momento.'
    case 404:
      return context === 'bets'
        ? 'Palpite ou comprovante não encontrado.'
        : 'Conteúdo não encontrado.'
    case 429:
      return 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.'
    case 502:
      return context === 'football'
        ? 'Não foi possível consultar os jogos agora. Tente novamente em alguns minutos.'
        : 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
    case 503:
      return 'O serviço está temporariamente indisponível. Tente novamente em alguns minutos.'
    case 500:
    default:
      if (context === 'bets') {
        return 'Não foi possível processar seu palpite. Tente novamente.'
      }
      if (context === 'football') {
        return 'Não foi possível carregar os jogos. Tente novamente.'
      }
      if (context === 'ranking') {
        return 'Não foi possível carregar a pontuação. Tente novamente.'
      }
      return 'Algo deu errado. Tente novamente.'
  }
}

export function toLoadError(error: unknown): LoadError {
  return {
    message: getFriendlyErrorMessage(error),
    statusCode: error instanceof ApiError ? error.statusCode : undefined,
  }
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'Sem conexão com a internet. Verifique sua rede e tente novamente.'
    }

    if (error.message && !isTechnicalErrorMessage(error.message)) {
      return error.message
    }

    return resolveApiErrorMessage(error.statusCode ?? 500, undefined, 'generic')
  }

  if (error instanceof Error) {
    if (isTechnicalErrorMessage(error.message)) {
      return 'Algo deu errado. Tente novamente.'
    }

    return error.message
  }

  return 'Algo deu errado. Tente novamente.'
}
