const TECHNICAL_MESSAGE_PATTERN =
  /POSTGRES|FOOTBALL_API|BOLAO_ACCESS|ADMIN_|VITE_|GEMINI_API|GOOGLE_API|XAI_API|Vercel|\.env|vari[aá]vel de ambiente|Environment Variables|redeploy|Settings\s*→/i

export const PUBLIC_MESSAGES = {
  SERVICE_UNAVAILABLE:
    'O serviço está temporariamente indisponível. Tente novamente em alguns minutos.',
  DATABASE_UNAVAILABLE:
    'Não foi possível acessar os dados agora. Tente novamente em alguns minutos.',
  FOOTBALL_UNAVAILABLE:
    'Não foi possível carregar os jogos agora. Tente novamente em alguns minutos.',
  FOOTBALL_TIMEOUT: 'A consulta demorou mais que o esperado. Tente novamente em alguns minutos.',
  BOLAO_UNAVAILABLE:
    'Não foi possível carregar os palpites agora. Tente novamente em alguns minutos.',
  ADMIN_UNAVAILABLE:
    'A área administrativa está temporariamente indisponível. Tente novamente mais tarde.',
  RANKING_UNAVAILABLE:
    'Não foi possível carregar a pontuação agora. Tente novamente em alguns minutos.',
  UNAUTHORIZED: 'Acesso não autorizado.',
  GENERIC: 'Algo deu errado. Tente novamente.',
}

export function isInternalErrorMessage(message) {
  if (!message || typeof message !== 'string') {
    return true
  }

  return TECHNICAL_MESSAGE_PATTERN.test(message)
}

export function isPostgresConfigError(error) {
  return error instanceof Error && error.message.includes('POSTGRES_URL não configurado')
}

export function isFootballConfigError(error) {
  return error instanceof Error && error.message.includes('FOOTBALL_API_TOKEN não configurado')
}
