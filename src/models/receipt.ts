import type { Bet } from './bet'

export interface Receipt {
  id: string
  bet: Bet
  generatedAt: string
}
