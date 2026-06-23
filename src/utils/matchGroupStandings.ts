import type { ApiStandingRow, ApiStandingTable } from '../models/api.types'
import type { Match } from '../models/match'
import type { Team } from '../models/team'
import { buildStandingsFromMatches } from './standingsBuilder'

export type StandingsTrend = 'up' | 'down' | 'neutral'

export interface MatchGroupStandingsPreview {
  standing: ApiStandingTable
  trends: Map<number, StandingsTrend>
  showTrends: boolean
  highlightTeamIds: number[]
}

interface TeamStats {
  team: Team
  playedGames: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

interface BuildGroupStandingOptions {
  skipMatchId?: number
  overrideMatch?: Match
}

function toApiTeam(team: Team) {
  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    tla: team.tla || null,
    crest: team.crest || null,
  }
}

function getOrCreateStats(statsByTeamId: Map<number, TeamStats>, team: Team): TeamStats {
  const teamId = team.id
  if (teamId == null) {
    throw new Error('Team id is required to build standings')
  }

  const existing = statsByTeamId.get(teamId)
  if (existing) return existing

  const created: TeamStats = {
    team,
    playedGames: 0,
    won: 0,
    draw: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }

  statsByTeamId.set(teamId, created)
  return created
}

function applyMatchResult(stats: TeamStats, goalsFor: number, goalsAgainst: number): void {
  stats.playedGames += 1
  stats.goalsFor += goalsFor
  stats.goalsAgainst += goalsAgainst

  if (goalsFor > goalsAgainst) {
    stats.won += 1
    stats.points += 3
    return
  }

  if (goalsFor < goalsAgainst) {
    stats.lost += 1
    return
  }

  stats.draw += 1
  stats.points += 1
}

function toStandingRow(stats: TeamStats, position: number): ApiStandingRow {
  return {
    position,
    team: toApiTeam(stats.team),
    playedGames: stats.playedGames,
    won: stats.won,
    draw: stats.draw,
    lost: stats.lost,
    points: stats.points,
    goalsFor: stats.goalsFor,
    goalsAgainst: stats.goalsAgainst,
    goalDifference: stats.goalsFor - stats.goalsAgainst,
  }
}

function sortTeamStats(stats: TeamStats[]): ApiStandingRow[] {
  return stats
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const goalDiffA = a.goalsFor - a.goalsAgainst
      const goalDiffB = b.goalsFor - b.goalsAgainst
      if (goalDiffB !== goalDiffA) return goalDiffB - goalDiffA
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.team.name.localeCompare(b.team.name, 'pt-BR')
    })
    .map((entry, index) => toStandingRow(entry, index + 1))
}

function buildGroupStandingFromMatches(
  allMatches: Match[],
  group: string,
  options: BuildGroupStandingOptions = {},
): ApiStandingTable | null {
  const groupMatches = allMatches.filter(
    (match) => match.stage === 'GROUP_STAGE' && match.group === group,
  )

  if (groupMatches.length === 0) return null

  const statsByTeamId = new Map<number, TeamStats>()

  for (const match of groupMatches) {
    if (match.homeTeam.id != null) getOrCreateStats(statsByTeamId, match.homeTeam)
    if (match.awayTeam.id != null) getOrCreateStats(statsByTeamId, match.awayTeam)
  }

  for (const match of groupMatches) {
    if (match.id === options.skipMatchId) continue
    if (match.homeTeam.id == null || match.awayTeam.id == null) continue

    const isOverride = options.overrideMatch?.id === match.id
    const sourceMatch = isOverride ? options.overrideMatch! : match

    if (sourceMatch.score.home == null || sourceMatch.score.away == null) continue

    const shouldApply = isOverride || match.status === 'finished'
    if (!shouldApply) continue

    const homeGoals = sourceMatch.score.home
    const awayGoals = sourceMatch.score.away
    const groupStats = statsByTeamId

    applyMatchResult(getOrCreateStats(groupStats, match.homeTeam), homeGoals, awayGoals)
    applyMatchResult(getOrCreateStats(groupStats, match.awayTeam), awayGoals, homeGoals)
  }

  if (statsByTeamId.size === 0) return null

  return {
    stage: 'GROUP_STAGE',
    type: 'TOTAL',
    group,
    table: sortTeamStats([...statsByTeamId.values()]),
  }
}

function getPositionByTeamId(table: ApiStandingRow[]): Map<number, number> {
  return new Map(
    table.flatMap((row) => (row.team.id != null ? [[row.team.id, row.position] as const] : [])),
  )
}

export function getStandingsTrends(
  baseline: ApiStandingTable,
  projected: ApiStandingTable,
): Map<number, StandingsTrend> {
  const before = getPositionByTeamId(baseline.table)
  const after = getPositionByTeamId(projected.table)
  const trends = new Map<number, StandingsTrend>()

  for (const teamId of new Set([...before.keys(), ...after.keys()])) {
    const posBefore = before.get(teamId)
    const posAfter = after.get(teamId)

    if (posBefore == null || posAfter == null) {
      trends.set(teamId, 'neutral')
      continue
    }

    if (posAfter < posBefore) {
      trends.set(teamId, 'up')
    } else if (posAfter > posBefore) {
      trends.set(teamId, 'down')
    } else {
      trends.set(teamId, 'neutral')
    }
  }

  return trends
}

export function buildMatchGroupStandingsPreview(
  allMatches: Match[],
  focusMatch: Match,
): MatchGroupStandingsPreview | null {
  if (focusMatch.stage !== 'GROUP_STAGE' || !focusMatch.group) {
    return null
  }

  const group = focusMatch.group
  const highlightTeamIds = [focusMatch.homeTeam.id, focusMatch.awayTeam.id].filter(
    (id): id is number => id != null,
  )

  const canProjectLive =
    focusMatch.isLive && focusMatch.score.home != null && focusMatch.score.away != null

  const baselineFromMatches = buildGroupStandingFromMatches(allMatches, group, {
    skipMatchId: canProjectLive ? focusMatch.id : undefined,
  })

  const projectedFromMatches = canProjectLive
    ? buildGroupStandingFromMatches(allMatches, group, { overrideMatch: focusMatch })
    : buildGroupStandingFromMatches(allMatches, group)

  const fallbackStanding =
    buildStandingsFromMatches(allMatches).find((standing) => standing.group === group) ?? null

  const baseline = baselineFromMatches ?? fallbackStanding
  const projected = projectedFromMatches ?? fallbackStanding

  if (!projected) return null

  const trends =
    canProjectLive && baseline
      ? getStandingsTrends(baseline, projected)
      : new Map<number, StandingsTrend>()

  if (!canProjectLive) {
    for (const row of projected.table) {
      if (row.team.id != null) {
        trends.set(row.team.id, 'neutral')
      }
    }
  }

  return {
    standing: projected,
    trends,
    showTrends: canProjectLive,
    highlightTeamIds,
  }
}
