import type { ApiTeamDetail } from './api.types'

export interface ChampionBetEntry {
  receiptId: string
  teamId: number
  team: ApiTeamDetail
  personName: string
  createdAt: string
  updatedAt?: string
  generatedAt: string
  points?: number
  scoreType?: 'pending' | 'exact' | 'none'
}

export interface ChampionBetMeta {
  finalMatch: {
    id: number
    utcDate: string
    status: string
    homeTeam: ApiTeamDetail
    awayTeam: ApiTeamDetail
  } | null
  deadline: string | null
  acceptingBets: boolean
  blockReason: string | null
  points: number
}

export interface ChampionBetsResponse {
  bets: ChampionBetEntry[]
  meta: ChampionBetMeta
}

export interface ChampionBetPayload {
  teamId: number
  personName: string
  createdAt: string
}

export interface ChampionReceipt {
  id: string
  generatedAt: string
  championBet: ChampionBetPayload & {
    team: ApiTeamDetail
  }
}
