import type { ApiMatch } from '../models/api.types'
import type { Match, MatchGroups } from '../models/match'
import { normalizeCrestUrl } from './crestUrl'
import { isLiveStatus, normalizeMatchStatus } from './matchStatus'
import { areMatchTeamsDefined } from './teamDisplay'

function mapTeam(team: ApiMatch['homeTeam']) {
  const isDefined = team.id != null && Boolean(team.name?.trim())

  return {
    id: team.id,
    name: team.name?.trim() || '',
    shortName: team.shortName?.trim() || team.name?.trim() || '',
    tla: team.tla?.trim() || '',
    crest: isDefined ? normalizeCrestUrl(team.crest?.trim() ?? '') : '',
    isDefined,
  }
}

export function mapApiMatchToMatch(apiMatch: ApiMatch): Match {
  const rawStatus = apiMatch.status
  const isLive = isLiveStatus(rawStatus)

  return {
    id: apiMatch.id,
    utcDate: apiMatch.utcDate,
    status: normalizeMatchStatus(rawStatus),
    rawStatus,
    minute: apiMatch.minute,
    venue: apiMatch.venue,
    matchday: apiMatch.matchday,
    stage: apiMatch.stage,
    group: apiMatch.group,
    homeTeam: mapTeam(apiMatch.homeTeam),
    awayTeam: mapTeam(apiMatch.awayTeam),
    score: {
      home: apiMatch.score.fullTime.home,
      away: apiMatch.score.fullTime.away,
    },
    halfTimeScore: {
      home: apiMatch.score.halfTime.home,
      away: apiMatch.score.halfTime.away,
    },
    isLive,
    lastUpdated: apiMatch.lastUpdated ?? null,
  }
}

export function mapApiMatchesToMatches(apiMatches: ApiMatch[]): Match[] {
  return apiMatches.map(mapApiMatchToMatch)
}

export function sortMatchesChronologically(matches: Match[]): Match[] {
  return [...matches]
    .filter(areMatchTeamsDefined)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
}

export function sortAllMatchesChronologically(matches: Match[]): Match[] {
  return [...matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
  )
}

function getTeamMatchSortPriority(match: Match): number {
  if (match.isLive) return 0
  return 1
}

function getTeamMatchStatusOrder(match: Match): number {
  if (match.status === 'scheduled') return 0
  if (match.status === 'finished') return 1
  return 2
}

export function sortTeamMatches(matches: Match[]): Match[] {
  return [...matches]
    .filter(areMatchTeamsDefined)
    .sort((a, b) => {
      const priorityDiff = getTeamMatchSortPriority(a) - getTeamMatchSortPriority(b)
      if (priorityDiff !== 0) return priorityDiff

      const statusOrderDiff = getTeamMatchStatusOrder(a) - getTeamMatchStatusOrder(b)
      if (statusOrderDiff !== 0) return statusOrderDiff

      return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    })
}

export function groupMatchesByStatus(matches: Match[]): MatchGroups {
  const live: Match[] = []
  const upcoming: Match[] = []
  const finished: Match[] = []

  for (const match of sortMatchesChronologically(matches)) {
    if (match.isLive) {
      live.push(match)
    } else if (match.status === 'finished') {
      finished.push(match)
    } else if (match.status === 'scheduled') {
      upcoming.push(match)
    }
  }

  return { live, upcoming, finished, undefined: [] }
}

export function formatScoreDisplay(match: Match): string {
  const { home, away } = match.score

  if (home !== null && away !== null) {
    return `${home} × ${away}`
  }

  if (match.status === 'scheduled') {
    return 'vs'
  }

  return '- × -'
}
