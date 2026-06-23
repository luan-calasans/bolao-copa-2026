const ADMIN_LOGIN_URL = '/api/admin/login'
const ADMIN_LOGOUT_URL = '/api/admin/logout'
const ADMIN_SESSION_URL = '/api/admin/session'

const adminFetchInit: RequestInit = {
  credentials: 'include',
}

async function parseErrorBody(
  response: Response,
  fallback: string,
): Promise<{ message: string; retryAfterSeconds?: number }> {
  try {
    const body = (await response.json()) as { message?: string; retryAfterSeconds?: number }
    const headerRetryAfter = Number(response.headers.get('Retry-After'))
    const retryAfterSeconds =
      body.retryAfterSeconds ??
      (Number.isFinite(headerRetryAfter) && headerRetryAfter > 0 ? headerRetryAfter : undefined)

    return {
      message: body.message ?? fallback,
      retryAfterSeconds,
    }
  } catch {
    return { message: fallback }
  }
}

export class AdminLoginError extends Error {
  readonly statusCode: number
  readonly retryAfterSeconds?: number

  constructor(message: string, statusCode: number, retryAfterSeconds?: number) {
    super(message)
    this.name = 'AdminLoginError'
    this.statusCode = statusCode
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export interface AdminSession {
  authenticated: boolean
  configured: boolean
  loginBlockedUntil?: number | null
}

export async function getAdminSession(): Promise<AdminSession> {
  const response = await fetch(ADMIN_SESSION_URL, adminFetchInit)

  if (!response.ok) {
    throw new Error('Não foi possível verificar a sessão administrativa.')
  }

  return (await response.json()) as AdminSession
}

export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch(ADMIN_LOGIN_URL, {
    ...adminFetchInit,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
    const { message, retryAfterSeconds } = await parseErrorBody(
      response,
      'Não foi possível realizar o login.',
    )
    throw new AdminLoginError(message, response.status, retryAfterSeconds)
  }
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(ADMIN_LOGOUT_URL, {
    ...adminFetchInit,
    method: 'POST',
  })

  if (!response.ok) {
    const { message } = await parseErrorBody(response, 'Não foi possível encerrar a sessão.')
    throw new Error(message)
  }
}
