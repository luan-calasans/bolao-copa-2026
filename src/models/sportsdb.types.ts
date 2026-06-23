export interface SportsdbTimelineEntry {
  idTimeline: string
  idEvent: string
  strTimeline: string
  strTimelineDetail: string | null
  strHome: string | null
  strEvent: string | null
  idPlayer: string | null
  strPlayer: string | null
  strAssist?: string | null
  intTime: string | null
  strPeriod: string | null
  idTeam: string | null
  strTeam: string | null
  strComment: string | null
  dateEvent: string | null
  strSeason: string | null
}

export interface SportsdbTimelineResponse {
  timeline: SportsdbTimelineEntry[] | null
}

export interface SportsdbEvent {
  idEvent: string
  idAPIfootball: string | null
  strEvent: string | null
  strFilename?: string | null
  strHomeTeam: string | null
  strAwayTeam: string | null
  strLeague: string | null
  strSeason: string | null
  strVenue: string | null
  strCity: string | null
  strCountry: string | null
  intSpectators: string | null
  strOfficial: string | null
  strVideo: string | null
  strPoster?: string | null
  strThumb?: string | null
  strFanart?: string | null
  strBanner?: string | null
  dateEvent: string | null
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string | null
}

export interface SportsdbLookupEventResponse {
  events: SportsdbEvent[] | null
}

export interface SportsdbSearchEventsResponse {
  event: SportsdbEvent[] | null
}

export interface SportsdbEventsDayResponse {
  events: SportsdbEvent[] | null
}

export interface SportsdbHighlightEntry {
  idEvent: string
  strEvent: string | null
  strSport: string | null
  strHomeTeam?: string | null
  strAwayTeam?: string | null
  strPoster: string | null
  strThumb: string | null
  strFanart: string | null
  strBanner?: string | null
}

export interface SportsdbHighlightsResponse {
  tvhighlights: SportsdbHighlightEntry[] | null
}

export interface SportsdbEventStatEntry {
  idStatistic: string
  idEvent: string
  strStat: string
  intHome: string | null
  intAway: string | null
}

export interface SportsdbEventStatsResponse {
  eventstats: SportsdbEventStatEntry[] | null
}

export interface SportsdbLineupEntry {
  idLineup: string
  idEvent: string
  strPosition: string | null
  strHome: string | null
  strSubstitute: string | null
  intSquadNumber: string | null
  strPlayer: string | null
  strTeam: string | null
}

export interface SportsdbLineupResponse {
  lineup: SportsdbLineupEntry[] | null
}

export interface MatchGoal {
  id: string
  minute: number
  minuteLabel: string
  playerName: string
  teamName: string
  isHomeTeam: boolean
  detail: string
  isOwnGoal: boolean
}

export type MatchTimelineKind = 'goal' | 'card' | 'substitution' | 'var' | 'other'

export interface MatchTimelineEvent {
  id: string
  kind: MatchTimelineKind
  minute: number
  minuteLabel: string
  playerName: string
  assistName: string | null
  teamName: string
  isHomeTeam: boolean
  detail: string
  isOwnGoal: boolean
}

export interface MatchEventInfo {
  league: string | null
  season: string | null
  venue: string | null
  city: string | null
  country: string | null
  spectators: number | null
  referee: string | null
  videoUrl: string | null
}

export interface MatchStat {
  id: string
  label: string
  homeValue: string
  awayValue: string
  homeNumeric: number | null
  awayNumeric: number | null
  isPercentage: boolean
}

export interface MatchLineupPlayer {
  id: string
  name: string
  number: number | null
  position: string | null
  isSubstitute: boolean
}

export interface MatchLineups {
  home: MatchLineupPlayer[]
  away: MatchLineupPlayer[]
}

export interface MatchDetails {
  eventInfo: MatchEventInfo | null
  goals: MatchGoal[]
  timeline: MatchTimelineEvent[]
  stats: MatchStat[]
  lineups: MatchLineups | null
}
