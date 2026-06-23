export interface AiPrediction {
  matchId: number
  homeScore: number
  awayScore: number
  analysis: string
  cached?: boolean
}
