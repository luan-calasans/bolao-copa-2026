import { useCallback, useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { AdminLoginError, getAdminSession, loginAdmin } from '../services/adminAuthService'

function getBlockedMessage(blockedUntil: number): string {
  const remainingSeconds = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000))

  const minutes = Math.max(1, Math.ceil(remainingSeconds / 60))

  return `Acesso bloqueado. Tente novamente em ${minutes} minuto(s).`
}

export function useAdminLoginViewModel() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [isConfigured, setIsConfigured] = useState(true)

  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)

  const isBlocked = blockedUntil !== null

  const applyBlockStatus = useCallback((until: number | null | undefined) => {
    if (until && until > Date.now()) {
      setBlockedUntil(until)

      setError(getBlockedMessage(until))

      return
    }

    setBlockedUntil(null)
  }, [])

  const checkSession = useCallback(async () => {
    try {
      const session = await getAdminSession()

      setIsConfigured(session.configured)

      applyBlockStatus(session.loginBlockedUntil)

      if (session.authenticated) {
        navigate('/admin/palpites', { replace: true })
      }
    } catch {
      // Mantém na tela de login se a verificação falhar.
    }
  }, [applyBlockStatus, navigate])

  useEffect(() => {
    if (!blockedUntil || blockedUntil <= Date.now()) return

    const timeoutId = window.setTimeout(
      () => {
        if (blockedUntil <= Date.now()) {
          setBlockedUntil(null)

          setError(null)
        }
      },
      blockedUntil - Date.now() + 50,
    )

    return () => window.clearTimeout(timeoutId)
  }, [blockedUntil])

  const submitLogin = useCallback(async () => {
    if (isBlocked) return

    const trimmedPassword = password.trim()

    if (!trimmedPassword) {
      setError('Informe a senha administrativa.')

      return
    }

    setIsSubmitting(true)

    setError(null)

    try {
      await loginAdmin(trimmedPassword)

      setBlockedUntil(null)

      navigate('/admin/palpites', { replace: true })
    } catch (err) {
      if (err instanceof AdminLoginError && err.statusCode === 429) {
        const until = err.retryAfterSeconds
          ? Date.now() + err.retryAfterSeconds * 1000
          : Date.now() + 5 * 60 * 1000

        applyBlockStatus(until)

        setError(err.message)

        return
      }

      setError(err instanceof Error ? err.message : 'Não foi possível realizar o login.')
    } finally {
      setIsSubmitting(false)
    }
  }, [applyBlockStatus, isBlocked, navigate, password])

  return {
    password,

    isSubmitting,

    error,

    isConfigured,

    isBlocked,

    setPassword,

    submitLogin,

    checkSession,
  }
}
