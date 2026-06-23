import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getParticipantSession,
  logoutParticipant,
  type ParticipantInfo,
  type ParticipantSession,
} from '../services/participantAuthService'
import { getAdminSession } from '../services/adminAuthService'
import { ParticipantSessionContext } from './participantSessionContext'

const unauthenticatedParticipantSession: ParticipantSession = {
  authenticated: false,
  configured: false,
}

const unauthenticatedAdminSession = {
  authenticated: false,
  configured: false,
}

interface ParticipantProviderProps {
  children: ReactNode
}

export function ParticipantProvider({ children }: ParticipantProviderProps) {
  const [participant, setParticipant] = useState<ParticipantInfo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)

  const refreshSession = useCallback(async () => {
    const [participantSession, adminSession] = await Promise.all([
      getParticipantSession().catch(() => unauthenticatedParticipantSession),
      getAdminSession().catch(() => unauthenticatedAdminSession),
    ])

    setIsConfigured(participantSession.configured)
    setIsAdmin(adminSession.authenticated)
    setParticipant(
      participantSession.authenticated && participantSession.participant
        ? participantSession.participant
        : null,
    )
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await refreshSession()
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [refreshSession])

  const logout = useCallback(async () => {
    await logoutParticipant()
    setParticipant(null)
  }, [])

  const value = useMemo(
    () => ({
      participant,
      isAdmin,
      isLoading,
      isConfigured,
      isAuthenticated: Boolean(participant),
      canBet: Boolean(participant) || isAdmin,
      refreshSession,
      logout,
    }),
    [participant, isAdmin, isLoading, isConfigured, refreshSession, logout],
  )

  return (
    <ParticipantSessionContext.Provider value={value}>{children}</ParticipantSessionContext.Provider>
  )
}
