import type { ApiMatch, ApiScore } from '../models/api.types'
import type { Match, MatchGroups, MatchScore, MatchWinner } from '../models/match'
import {
  resolvePenaltyScoreFromApi,
  resolveRegulationScoreFromApi,
} from '../../shared/footballApiScore.js'
import { normalizeCrestUrl } from './crestUrl'
import { isLiveStatus, normalizeMatchStatus } from './matchStatus'
import { areMatchTeamsDefined } from './teamDisplay'

function mapScoreDetail(detail: { home: number | null; away: number | null } | undefined): MatchScore | null {
  if (!detail || detail.home == null || detail.away == null) {
    return null
  }

  return { home: detail.home, away: detail.away }
}

function mapApiWinner(winner: ApiScore['winner']): MatchWinner | null {
  if (winner === 'HOME_TEAM') return 'home'
  if (winner === 'AWAY_TEAM') return 'away'
  if (winner === 'DRAW') return 'draw'
  return null
}

function resolveRegulationScore(apiScore: ApiScore): MatchScore {
  return resolveRegulationScoreFromApi(apiScore)
}

function mapPenaltyScore(apiScore: ApiScore): MatchScore | null {
  return resolvePenaltyScoreFromApi(apiScore)
}

function mapExtraTimeScore(apiScore: ApiScore): MatchScore | null {
  if (apiScore.penalties?.home != null && apiScore.penalties?.away != null) {
    return null
  }

  const extraTime = mapScoreDetail(apiScore.extraTime)
  if (!extraTime || (extraTime.home === 0 && extraTime.away === 0)) {
    return null
  }

  const regulation = resolveRegulationScore(apiScore)
  if (regulation.home == null || regulation.away == null || regulation.home !== regulation.away) {
    return null
  }

  return extraTime
}

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
    score: resolveRegulationScore(apiMatch.score),
    halfTimeScore: {
      home: apiMatch.score.halfTime.home,
      away: apiMatch.score.halfTime.away,
    },
    penalties: mapPenaltyScore(apiMatch.score),
    extraTime: mapExtraTimeScore(apiMatch.score),
    winner: mapApiWinner(apiMatch.score.winner),
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
    const penalties = match.penalties
    if (penalties?.home != null && penalties?.away != null) {
      return `${home} × ${away} · Pênaltis ${penalties.home} × ${penalties.away}`
    }

    const extraTime = match.extraTime
    if (extraTime?.home != null && extraTime?.away != null) {
      return `${home} × ${away} · Prorrogação ${home + extraTime.home} × ${away + extraTime.away}`
    }

    return `${home} × ${away}`
  }

  if (match.status === 'scheduled') {
    return 'vs'
  }

  return '- × -'
}
