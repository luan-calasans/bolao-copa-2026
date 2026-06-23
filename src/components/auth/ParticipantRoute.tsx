import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useParticipant } from '../../hooks/useParticipant'
import { LoadingState } from '../ui/LoadingState'
import { APP_ROUTES } from '../../routes/routePaths'

interface ParticipantRouteProps {
  children: ReactNode
}

export function ParticipantRoute({ children }: ParticipantRouteProps) {
  const location = useLocation()
  const { canBet, isLoading } = useParticipant()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setReady(true)
    }
  }, [isLoading])

  if (!ready) {
    return <LoadingState lines={3} />
  }

  if (!canBet) {
    return (
      <Navigate
        to={APP_ROUTES.participantLogin}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}
