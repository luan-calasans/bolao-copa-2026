import { createContext } from 'react'
import type { ParticipantInfo } from '../services/participantAuthService'

export interface ParticipantContextValue {
  participant: ParticipantInfo | null
  isAdmin: boolean
  isLoading: boolean
  isConfigured: boolean
  isAuthenticated: boolean
  canBet: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
}

export const ParticipantSessionContext = createContext<ParticipantContextValue | null>(null)
