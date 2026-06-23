import { useContext } from 'react'
import { ParticipantSessionContext } from '../contexts/participantSessionContext'

export function useParticipant() {
  const context = useContext(ParticipantSessionContext)

  if (!context) {
    throw new Error('useParticipant deve ser usado dentro de ParticipantProvider.')
  }

  return context
}
