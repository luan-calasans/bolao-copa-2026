export interface HistoricalGoal {
  name: string
  minute: number
  penalty?: boolean
  owngoal?: boolean
  offset?: number
}

export interface HistoricalScore {
  ft?: [number, number]
  ht?: [number, number]
  et?: [number, number]
  p?: [number, number]
}

export interface HistoricalRawMatch {
  round: string
  date: string
  time?: string
  team1: string
  team2: string
  score?: HistoricalScore
  status?: string
  goals1?: HistoricalGoal[]
  goals2?: HistoricalGoal[]
  group?: string
  ground?: string
}

export interface HistoricalWorldCupJson {
  name: string
  matches: HistoricalRawMatch[]
}

export interface HistoricalGroupsJson {
  name: string
  groups: Array<{
    name: string
    teams: string[]
  }>
}

export interface HistoricalStandingsJson {
  name: string
  groups: Array<{
    name: string
    standings: Array<{
      team: { name: string; code: string }
      pos: number
      played: number
      won: number
      drawn: number
      lost: number
      goals_for: number
      goals_against: number
      pts: number
    }>
  }>
}

export interface HistoricalTeamsJson {
  name: string
  teams: Array<{
    name: string
    code: string
    continent?: string
    confed?: string
  }>
}

export interface HistoricalDataIndex {
  schemaVersion: number
  worldCups: Array<{
    year: number
    files: string[]
  }>
}

export type HistoricalMatchPhase = 'group' | 'knockout' | 'final_round'

export interface TournamentSummary {
  year: number
  champion: string
  runnerUp: string | null
  finalScore: string | null
  hostNote?: string | null
}

export interface TeamWorldCupStats {
  canonicalName: string
  displayName: string
  titles: number
  finalsPlayed: number
  participations: number
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  winRate: number
  goalsFor: number
  goalsAgainst: number
  avgGoalsFor: number
  avgGoalsAgainst: number
  groupMatches: number
  groupWins: number
  groupDraws: number
  groupLosses: number
  knockoutMatches: number
  knockoutWins: number
  knockoutDraws: number
  knockoutLosses: number
}

export interface HistoricalTournamentData {
  year: number
  name: string
  matches: HistoricalRawMatch[]
  groups: HistoricalGroupsJson | null
  standings: HistoricalStandingsJson | null
  teams: HistoricalTeamsJson | null
  summary: TournamentSummary
}
