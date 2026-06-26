import type { ApiScorer, ApiStandingTable, ApiTeam } from '../models/api.types'
import type {
  HistoricalRawMatch,
  HistoricalStandingsJson,
  HistoricalTeamsJson,
} from '../models/historicalWorldCup'
import type { TeamGoalsEntry } from './teamGoalsFromMatches'
import { canonicalizeTeamName, getHistoricalTeamDisplayName, getTeamCode, syntheticTeamId } from './historicalTeamNames'
import { getHistoricalTeamCrestUrl } from './historicalTeamCrest'
import { getHistoricalMatchPhase, getRegulationScore, isCountedHistoricalMatch, resolveMatchOutcome } from './historicalMatchUtils'

function getMatchdayNumber(round: string): number | null {
  const match = round.match(/matchday\s+(\d+)/i)
  return match ? Number.parseInt(match[1], 10) : null
}

function getStandingsGroupKey(match: HistoricalRawMatch): string | null {
  if (!match.group) return null

  const matchday = getMatchdayNumber(match.round)
  if (matchday != null && matchday >= 4) {
    return `${match.group} (2ª fase)`
  }

  return match.group
}

function buildApiTeam(name: string, codeFromData?: string | null): ApiTeam {
  const canonical = canonicalizeTeamName(name)
  const displayName = getHistoricalTeamDisplayName(name)

  return {
    id: syntheticTeamId(canonical),
    name: displayName,
    shortName: displayName,
    tla: getTeamCode(canonical, codeFromData),
    crest: getHistoricalTeamCrestUrl(name),
  }
}

export function buildHistoricalScorers(matches: HistoricalRawMatch[]): ApiScorer[] {
  const scorers = new Map<string, ApiScorer>()

  for (const match of matches) {
    if (!isCountedHistoricalMatch(match)) continue

    const homeTeam = buildApiTeam(match.team1)
    const awayTeam = buildApiTeam(match.team2)
    const regulation = getRegulationScore(match.score)
    if (!regulation) continue

    for (const goal of match.goals1 ?? []) {
      if (goal.owngoal) continue

      const key = `${goal.name}::${homeTeam.id}`
      const existing = scorers.get(key)

      if (existing) {
        existing.goals = (existing.goals ?? 0) + 1
        existing.penalties = (existing.penalties ?? 0) + (goal.penalty ? 1 : 0)
        continue
      }

      scorers.set(key, {
        player: {
          id: syntheticTeamId(`${goal.name}-${homeTeam.id}`),
          name: goal.name,
        },
        team: homeTeam,
        goals: 1,
        penalties: goal.penalty ? 1 : 0,
        assists: 0,
        playedMatches: null,
      })
    }

    for (const goal of match.goals2 ?? []) {
      if (goal.owngoal) continue

      const key = `${goal.name}::${awayTeam.id}`
      const existing = scorers.get(key)

      if (existing) {
        existing.goals = (existing.goals ?? 0) + 1
        existing.penalties = (existing.penalties ?? 0) + (goal.penalty ? 1 : 0)
        continue
      }

      scorers.set(key, {
        player: {
          id: syntheticTeamId(`${goal.name}-${awayTeam.id}`),
          name: goal.name,
        },
        team: awayTeam,
        goals: 1,
        penalties: goal.penalty ? 1 : 0,
        assists: 0,
        playedMatches: null,
      })
    }

  }

  return [...scorers.values()]
    .filter((scorer) => (scorer.goals ?? 0) > 0)
    .sort((left, right) => {
      const goalsDiff = (right.goals ?? 0) - (left.goals ?? 0)
      if (goalsDiff !== 0) return goalsDiff

      const leftName = left.player.name ?? ''
      const rightName = right.player.name ?? ''
      return leftName.localeCompare(rightName, 'pt-BR')
    })
}

export function buildHistoricalTeamGoals(matches: HistoricalRawMatch[]): TeamGoalsEntry[] {
  const entries = new Map<number, TeamGoalsEntry>()

  function getEntry(team: ApiTeam): TeamGoalsEntry {
    const teamId = team.id
    if (teamId == null) {
      throw new Error('Team id is required')
    }

    const existing = entries.get(teamId)
    if (existing) return existing

    const created: TeamGoalsEntry = {
      team: {
        id: teamId,
        name: team.name ?? '',
        shortName: team.shortName ?? team.name ?? '',
        tla: team.tla ?? '',
        crest: team.crest ?? '',
        isDefined: true,
      },
      playedGames: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    }

    entries.set(teamId, created)
    return created
  }

  for (const match of matches) {
    if (!isCountedHistoricalMatch(match)) continue

    const regulation = getRegulationScore(match.score)
    if (!regulation) continue

    const [homeGoals, awayGoals] = regulation
    const home = getEntry(buildApiTeam(match.team1))
    const away = getEntry(buildApiTeam(match.team2))

    home.playedGames += 1
    away.playedGames += 1
    home.goalsFor += homeGoals
    home.goalsAgainst += awayGoals
    away.goalsFor += awayGoals
    away.goalsAgainst += homeGoals
    home.goalDifference = home.goalsFor - home.goalsAgainst
    away.goalDifference = away.goalsFor - away.goalsAgainst
  }

  return [...entries.values()].sort((left, right) => {
    if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor
    return (left.team.name ?? '').localeCompare(right.team.name ?? 'pt-BR')
  })
}

export function mapHistoricalStandings(
  standings: HistoricalStandingsJson,
): ApiStandingTable[] {
  return standings.groups.map((group) => ({
    stage: 'GROUP_STAGE',
    type: 'TOTAL',
    group: group.name.replace(/^Group\s+/i, 'GROUP_'),
    table: group.standings.map((row) => ({
      position: row.pos,
      team: buildApiTeam(row.team.name, row.team.code),
      playedGames: row.played,
      won: row.won,
      draw: row.drawn,
      lost: row.lost,
      points: row.pts,
      goalsFor: row.goals_for,
      goalsAgainst: row.goals_against,
      goalDifference: row.goals_for - row.goals_against,
    })),
  }))
}

export function buildStandingsFromMatches(
  matches: HistoricalRawMatch[],
  teamsFile: HistoricalTeamsJson | null,
): ApiStandingTable[] {
  const codeByName = new Map<string, string>()

  for (const team of teamsFile?.teams ?? []) {
    codeByName.set(canonicalizeTeamName(team.name), team.code)
  }

  const groups = new Map<string, Map<string, {
    team: ApiTeam
    playedGames: number
    won: number
    draw: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    points: number
  }>>()

  for (const match of matches) {
    if (!isCountedHistoricalMatch(match)) continue
    if (getHistoricalMatchPhase(match) !== 'group') continue

    const groupKey = getStandingsGroupKey(match)
    if (!groupKey) continue

    const regulation = getRegulationScore(match.score)
    if (!regulation) continue

    const bucket = groups.get(groupKey) ?? new Map()
    groups.set(groupKey, bucket)

    const homeTeam = buildApiTeam(match.team1, codeByName.get(canonicalizeTeamName(match.team1)))
    const awayTeam = buildApiTeam(match.team2, codeByName.get(canonicalizeTeamName(match.team2)))

    function ensureRow(team: ApiTeam) {
      const key = team.name ?? ''
      const existing = bucket.get(key)

      if (existing) return existing

      const created = {
        team,
        playedGames: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }

      bucket.set(key, created)
      return created
    }

    const homeRow = ensureRow(homeTeam)
    const awayRow = ensureRow(awayTeam)
    const [homeGoals, awayGoals] = regulation
    const outcome = resolveMatchOutcome(match.score)

    homeRow.playedGames += 1
    awayRow.playedGames += 1
    homeRow.goalsFor += homeGoals
    homeRow.goalsAgainst += awayGoals
    awayRow.goalsFor += awayGoals
    awayRow.goalsAgainst += homeGoals

    if (outcome === 'team1') {
      homeRow.won += 1
      awayRow.lost += 1
      homeRow.points += 3
    } else if (outcome === 'team2') {
      awayRow.won += 1
      homeRow.lost += 1
      awayRow.points += 3
    } else {
      homeRow.draw += 1
      awayRow.draw += 1
      homeRow.points += 1
      awayRow.points += 1
    }
  }

  return [...groups.entries()].map(([groupName, rows]) => {
    const table = [...rows.values()]
      .sort((left, right) => {
        if (right.points !== left.points) return right.points - left.points
        const leftGd = left.goalsFor - left.goalsAgainst
        const rightGd = right.goalsFor - right.goalsAgainst
        if (rightGd !== leftGd) return rightGd - leftGd
        if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor
        return (left.team.name ?? '').localeCompare(right.team.name ?? 'pt-BR')
      })
      .map((row, index) => ({
        position: index + 1,
        team: row.team,
        playedGames: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        points: row.points,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalsFor - row.goalsAgainst,
      }))

    return {
      stage: 'GROUP_STAGE',
      type: 'TOTAL',
      group: groupName.replace(/^Group\s+/i, 'GROUP_'),
      table,
    }
  })
}
