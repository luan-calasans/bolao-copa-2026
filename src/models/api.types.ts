export interface ApiTeam {
  id: number | null
  name: string | null
  shortName: string | null
  tla: string | null
  crest: string | null
}

export interface ApiScoreDetail {
  home: number | null
  away: number | null
}

export interface ApiScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
  duration: string
  fullTime: ApiScoreDetail
  halfTime: ApiScoreDetail
  regularTime?: ApiScoreDetail
  extraTime?: ApiScoreDetail
  penalties?: ApiScoreDetail
}

export type ApiMatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'LIVE'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'AWARDED'

export interface ApiMatch {
  id: number
  utcDate: string
  status: ApiMatchStatus
  minute: number | null
  venue: string | null
  matchday: number | null
  stage: string
  group: string | null
  lastUpdated?: string | null
  homeTeam: ApiTeam
  awayTeam: ApiTeam
  score: ApiScore
}

export interface ApiMatchesResponse {
  matches: ApiMatch[]
  resultSet?: {
    count: number
    competitions?: string
    first?: string
    last?: string
    played?: number
  }
}

export interface ApiErrorResponse {
  message?: string
  errorCode?: number
}

export interface ApiSeason {
  id: number
  startDate: string
  endDate: string
  currentMatchday: number | null
  winner: ApiTeam | null
}

export interface ApiCompetition {
  id: number
  name: string
  code: string
  type: string
  emblem: string | null
  plan?: string
  currentSeason?: ApiSeason
  numberOfAvailableSeasons?: number
  lastUpdated?: string
}

export interface ApiCompetitionsResponse {
  count: number
  filters?: Record<string, string | number>
  competitions: ApiCompetition[]
}

export interface ApiPerson {
  id: number
  name: string
  nationality?: string | null
  dateOfBirth?: string | null
  position?: string | null
}

export interface ApiTeamDetail extends ApiTeam {
  address?: string | null
  website?: string | null
  founded?: number | null
  clubColors?: string | null
  venue?: string | null
  coach?: ApiPerson | null
  runningCompetitions?: ApiCompetition[]
  squad?: ApiPerson[]
  staff?: ApiPerson[]
}

export interface ApiTeamsResponse {
  count: number
  filters?: Record<string, string | number>
  competition?: ApiCompetition
  season?: ApiSeason
  teams: ApiTeamDetail[]
}

export interface ApiStandingRow {
  position: number
  team: ApiTeam
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

export interface ApiStandingTable {
  stage: string
  type: string
  group: string | null
  table: ApiStandingRow[]
}

export interface ApiStandingsResponse {
  filters?: Record<string, string | number>
  competition?: ApiCompetition
  season?: ApiSeason
  standings: ApiStandingTable[]
}

export interface ApiScorer {
  player: ApiPerson
  team: ApiTeam
  playedMatches?: number | null
  goals: number | null
  assists?: number | null
  penalties?: number | null
}

export interface ApiScorersResponse {
  count?: number
  filters?: Record<string, string | number>
  competition?: ApiCompetition
  season?: ApiSeason
  scorers: ApiScorer[]
}

export interface ApiTeamMatchesResponse {
  filters?: Record<string, string | number>
  resultSet?: {
    count: number
    competitions?: string
    first?: string
    last?: string
    played?: number
  }
  matches: ApiMatch[]
}
