import type { Match } from '../models/match'
import type { Team } from '../models/team'

export interface TeamGoalsEntry {
  team: Team
  playedGames: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

function getOrCreateEntry(
  entriesByTeamId: Map<number, TeamGoalsEntry>,
  team: Team,
): TeamGoalsEntry {
  const teamId = team.id
  if (teamId == null) {
    throw new Error('Team id is required to build team goals')
  }

  const existing = entriesByTeamId.get(teamId)
  if (existing) return existing

  const created: TeamGoalsEntry = {
    team,
    playedGames: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  }

  entriesByTeamId.set(teamId, created)
  return created
}

function applyMatchGoals(entry: TeamGoalsEntry, goalsFor: number, goalsAgainst: number): void {
  entry.playedGames += 1
  entry.goalsFor += goalsFor
  entry.goalsAgainst += goalsAgainst
  entry.goalDifference = entry.goalsFor - entry.goalsAgainst
}

function sortTeamGoals(entries: TeamGoalsEntry[]): TeamGoalsEntry[] {
  return entries.sort((a, b) => {
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsAgainst !== a.goalsAgainst) return a.goalsAgainst - b.goalsAgainst
    return a.team.name.localeCompare(b.team.name, 'pt-BR')
  })
}

export function buildTeamGoalsFromMatches(matches: Match[]): TeamGoalsEntry[] {
  const entriesByTeamId = new Map<number, TeamGoalsEntry>()

  for (const match of matches) {
    if (match.status !== 'finished') continue
    if (match.score.home == null || match.score.away == null) continue
    if (match.homeTeam.id == null || match.awayTeam.id == null) continue

    const homeGoals = match.score.home
    const awayGoals = match.score.away

    const homeEntry = getOrCreateEntry(entriesByTeamId, match.homeTeam)
    const awayEntry = getOrCreateEntry(entriesByTeamId, match.awayTeam)

    applyMatchGoals(homeEntry, homeGoals, awayGoals)
    applyMatchGoals(awayEntry, awayGoals, homeGoals)
  }

  return sortTeamGoals([...entriesByTeamId.values()])
}
