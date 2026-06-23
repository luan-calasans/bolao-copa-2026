import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  claimLegacyParticipantAccount,
  fetchUnclaimedLegacyParticipants,
  getParticipantSession,
  loginParticipantWithEmail,
  ParticipantAuthError,
  registerParticipantAccount,
  type ParticipantAuthMode,
  type UnclaimedLegacyParticipant,
} from '../services/participantAuthService'
import { useParticipant } from '../hooks/useParticipant'
import { APP_ROUTES } from '../routes/routePaths'
import {
  personNameContainsDigits,
  validatePersonName,
} from '../utils/betValidation'
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '../utils/participantCredentials'

const LOGIN_BLOCK_DURATION_MS = 5 * 60 * 1000

function getLoginBlockedMessage(blockedUntil: number): string {
  const remainingSeconds = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000))
  const minutes = Math.max(1, Math.ceil(remainingSeconds / 60))
  return `Acesso bloqueado. Tente novamente em ${minutes} minuto(s).`
}

export function useParticipantLoginViewModel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshSession, isConfigured } = useParticipant()

  const [mode, setMode] = useState<ParticipantAuthMode>('login')
  const [personName, setPersonName] = useState('')
  const [selectedPersonNameKey, setSelectedPersonNameKey] = useState('')
  const [unclaimedParticipants, setUnclaimedParticipants] = useState<UnclaimedLegacyParticipant[]>(
    [],
  )
  const [isLoadingUnclaimed, setIsLoadingUnclaimed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginBlockedUntil, setLoginBlockedUntil] = useState<number | null>(null)

  const isLoginBlocked = loginBlockedUntil !== null

  const applyLoginBlockStatus = useCallback((until: number | null | undefined) => {
    if (until && until > Date.now()) {
      setLoginBlockedUntil(until)
      setError(getLoginBlockedMessage(until))
      return
    }

    setLoginBlockedUntil(null)
  }, [])

  const checkLoginBlockStatus = useCallback(async () => {
    try {
      const session = await getParticipantSession()
      applyLoginBlockStatus(session.loginBlockedUntil)
    } catch {
      // Mantém na tela de login se a verificação falhar.
    }
  }, [applyLoginBlockStatus])

  const redirectTarget =
    (location.state as { from?: string } | null)?.from ?? APP_ROUTES.home

  const selectedUnclaimedParticipant = useMemo(
    () =>
      unclaimedParticipants.find(
        (participant) => participant.personNameKey === selectedPersonNameKey,
      ) ?? null,
    [selectedPersonNameKey, unclaimedParticipants],
  )

  const loadUnclaimedParticipants = useCallback(async () => {
    setIsLoadingUnclaimed(true)
    setError(null)

    try {
      const participants = await fetchUnclaimedLegacyParticipants()
      setUnclaimedParticipants(participants)
      setSelectedPersonNameKey((current) => {
        if (current && participants.some((item) => item.personNameKey === current)) {
          return current
        }
        return participants[0]?.personNameKey ?? ''
      })
    } catch (err) {
      setUnclaimedParticipants([])
      setSelectedPersonNameKey('')
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os participantes sem cadastro.',
      )
    } finally {
      setIsLoadingUnclaimed(false)
    }
  }, [])

  const initialize = useCallback(async () => {
    if (!isConfigured) {
      return
    }

    if (mode === 'login') {
      await checkLoginBlockStatus()
      return
    }

    if (mode === 'claim') {
      await loadUnclaimedParticipants()
    }
  }, [isConfigured, mode, checkLoginBlockStatus, loadUnclaimedParticipants])

  useEffect(() => {
    if (!loginBlockedUntil || loginBlockedUntil <= Date.now()) {
      return
    }

    const timeoutId = window.setTimeout(
      () => {
        if (loginBlockedUntil <= Date.now()) {
          setLoginBlockedUntil(null)
          setError(null)
        }
      },
      loginBlockedUntil - Date.now() + 50,
    )

    return () => window.clearTimeout(timeoutId)
  }, [loginBlockedUntil])

  const switchMode = useCallback(
    (nextMode: ParticipantAuthMode) => {
      setMode(nextMode)
      setError(null)
      setPassword('')
      setPasswordConfirmation('')
      setSelectedPersonNameKey('')
      setPersonName('')
      setUnclaimedParticipants([])

      if (nextMode !== 'login') {
        setLoginBlockedUntil(null)
      }

      if (!isConfigured) {
        return
      }

      if (nextMode === 'claim') {
        void loadUnclaimedParticipants()
      }

      if (nextMode === 'login') {
        void checkLoginBlockStatus()
      }
    },
    [isConfigured, loadUnclaimedParticipants, checkLoginBlockStatus],
  )

  const submitLogin = useCallback(async () => {
    if (isLoginBlocked) {
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await loginParticipantWithEmail(email, password)
      setLoginBlockedUntil(null)
      await refreshSession()
      navigate(redirectTarget, { replace: true })
    } catch (err) {
      if (err instanceof ParticipantAuthError && err.statusCode === 429) {
        const until = err.retryAfterSeconds
          ? Date.now() + err.retryAfterSeconds * 1000
          : Date.now() + LOGIN_BLOCK_DURATION_MS

        applyLoginBlockStatus(until)
        setError(err.message)
        return
      }

      setError(err instanceof Error ? err.message : 'Não foi possível realizar o login.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    email,
    password,
    navigate,
    redirectTarget,
    refreshSession,
    isLoginBlocked,
    applyLoginBlockStatus,
  ])

  const submitRegister = useCallback(async () => {
    const nameError = validatePersonName(personName)
    if (nameError) {
      setError(nameError)
      return
    }

    if (personNameContainsDigits(personName)) {
      setError('O nome no bolão não pode conter números.')
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    const passwordError = validatePasswordConfirmation(password, passwordConfirmation)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await registerParticipantAccount({
        personName: personName.trim(),
        email,
        password,
        passwordConfirmation,
      })
      await refreshSession()
      navigate(redirectTarget, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o cadastro.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    personName,
    email,
    password,
    passwordConfirmation,
    navigate,
    redirectTarget,
    refreshSession,
  ])

  const submitClaim = useCallback(async () => {
    if (!selectedUnclaimedParticipant) {
      setError('Selecione seu nome no bolão.')
      return
    }

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    const passwordError = validatePasswordConfirmation(password, passwordConfirmation)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await claimLegacyParticipantAccount({
        personName: selectedUnclaimedParticipant.displayName,
        email,
        password,
        passwordConfirmation,
      })
      await refreshSession()
      navigate(redirectTarget, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível vincular seus palpites.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    selectedUnclaimedParticipant,
    email,
    password,
    passwordConfirmation,
    navigate,
    redirectTarget,
    refreshSession,
  ])

  return {
    mode,
    personName,
    selectedPersonNameKey,
    unclaimedParticipants,
    selectedUnclaimedParticipant,
    isLoadingUnclaimed,
    email,
    password,
    passwordConfirmation,
    isSubmitting,
    error,
    isLoginBlocked,
    isConfigured,
    redirectTarget,
    setPersonName,
    setSelectedPersonNameKey,
    setEmail,
    setPassword,
    setPasswordConfirmation,
    switchMode,
    submitLogin,
    submitRegister,
    submitClaim,
    initialize,
    reloadUnclaimedParticipants: loadUnclaimedParticipants,
  }
}
