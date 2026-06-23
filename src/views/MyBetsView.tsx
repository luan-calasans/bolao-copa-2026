import { ParticipantBetsView } from './ParticipantBetsView'
import { useParticipant } from '../hooks/useParticipant'
import { Navigate } from 'react-router-dom'
import { LoadingState } from '../components/ui/LoadingState'
import { APP_ROUTES } from '../routes/routePaths'

export function MyBetsView() {
  const { participant, isLoading } = useParticipant()

  if (isLoading) {
    return <LoadingState lines={4} />
  }

  if (!participant) {
    return <Navigate to={APP_ROUTES.participantLogin} replace state={{ from: APP_ROUTES.myBets }} />
  }

  return (
    <ParticipantBetsView
      personNameKey={participant.personNameKey}
      pageTitle="Meus palpites"
      backTo={APP_ROUTES.home}
      backLabel="Voltar aos jogos"
      description="Seus palpites registrados no bolão, incluindo o palpite de campeão."
    />
  )
}
