import type { ApiStandingRow, ApiStandingTable, ApiTeam } from '../models/api.types'
import type { Match } from '../models/match'
import type { Team } from '../models/team'

const GROUP_STAGE_GROUP_PATTERN = /^GROUP_[A-L]$/i

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

function toApiTeam(team: Team): ApiTeam {
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

function buildTeamToGroupMap(matches: Match[]): Map<number, string> {
  const teamToGroup = new Map<number, string>()

  for (const match of matches) {
    if (match.stage !== 'GROUP_STAGE' || !match.group) continue

    if (match.homeTeam.id != null) {
      teamToGroup.set(match.homeTeam.id, match.group)
    }

    if (match.awayTeam.id != null) {
      teamToGroup.set(match.awayTeam.id, match.group)
    }
  }

  return teamToGroup
}

export function isGroupStanding(standing: ApiStandingTable): boolean {
  return (
    standing.type === 'TOTAL' && !!standing.group && GROUP_STAGE_GROUP_PATTERN.test(standing.group)
  )
}

function splitOverallStandingsByGroup(
  standings: ApiStandingTable[],
  matches: Match[],
): ApiStandingTable[] {
  const overallTables = standings.filter(
    (standing) => standing.type === 'TOTAL' && !standing.group && standing.table.length > 0,
  )

  if (overallTables.length === 0) return []

  const teamToGroup = buildTeamToGroupMap(matches)
  if (teamToGroup.size === 0) return []

  const rowsByGroup = new Map<string, ApiStandingRow[]>()

  for (const standing of overallTables) {
    for (const row of standing.table) {
      const teamId = row.team.id
      if (teamId == null) continue

      const group = teamToGroup.get(teamId)
      if (!group || !GROUP_STAGE_GROUP_PATTERN.test(group)) continue

      const groupRows = rowsByGroup.get(group) ?? []
      groupRows.push(row)
      rowsByGroup.set(group, groupRows)
    }
  }

  return [...rowsByGroup.entries()]
    .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
    .map(([group, rows]) => ({
      stage: 'GROUP_STAGE',
      type: 'TOTAL',
      group,
      table: rows
        .sort((a, b) => a.position - b.position)
        .map((row, index) => ({ ...row, position: index + 1 })),
    }))
}

export function buildStandingsFromMatches(matches: Match[]): ApiStandingTable[] {
  const groupStageMatches = matches.filter((match) => match.stage === 'GROUP_STAGE' && match.group)

  const finishedGroupMatches = groupStageMatches.filter(
    (match) => match.status === 'finished' && match.score.home != null && match.score.away != null,
  )

  const groups = new Map<string, Map<number, TeamStats>>()

  for (const match of groupStageMatches) {
    const group = match.group!
    const groupStats = groups.get(group) ?? new Map<number, TeamStats>()
    groups.set(group, groupStats)

    if (match.homeTeam.id != null) {
      getOrCreateStats(groupStats, match.homeTeam)
    }

    if (match.awayTeam.id != null) {
      getOrCreateStats(groupStats, match.awayTeam)
    }
  }

  for (const match of finishedGroupMatches) {
    const group = match.group!
    const homeGoals = match.score.home!
    const awayGoals = match.score.away!

    if (match.homeTeam.id == null || match.awayTeam.id == null) continue

    const groupStats = groups.get(group)
    if (!groupStats) continue

    const homeStats = getOrCreateStats(groupStats, match.homeTeam)
    const awayStats = getOrCreateStats(groupStats, match.awayTeam)

    applyMatchResult(homeStats, homeGoals, awayGoals)
    applyMatchResult(awayStats, awayGoals, homeGoals)
  }

  return [...groups.entries()]
    .filter(([group]) => GROUP_STAGE_GROUP_PATTERN.test(group))
    .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
    .map(([group, statsByTeamId]) => ({
      stage: 'GROUP_STAGE',
      type: 'TOTAL',
      group,
      table: sortTeamStats([...statsByTeamId.values()]),
    }))
}

export function getVisibleStandings(standings: ApiStandingTable[]): ApiStandingTable[] {
  return standings
    .filter(isGroupStanding)
    .filter((standing) => standing.table.length > 0)
    .sort((a, b) => (a.group ?? '').localeCompare(b.group ?? ''))
}

export function resolveGroupStandings(
  apiStandings: ApiStandingTable[],
  matches: Match[],
): ApiStandingTable[] {
  const groupStandings = getVisibleStandings(apiStandings)
  if (groupStandings.length > 0) return groupStandings

  const splitStandings = splitOverallStandingsByGroup(apiStandings, matches)
  if (splitStandings.length > 0) return splitStandings

  return buildStandingsFromMatches(matches)
}
