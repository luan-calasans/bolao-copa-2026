import type { HistoricalRawMatch, TeamWorldCupStats, TournamentSummary } from '../models/historicalWorldCup'
import { canonicalizeTeamName, getHistoricalTeamDisplayName } from './historicalTeamNames'
import {
  extractTournamentSummary,
  getHistoricalMatchPhase,
  getRegulationScore,
  isCountedHistoricalMatch,
  isFinalistTeam,
  resolveMatchOutcome,
} from './historicalMatchUtils'

function createEmptyStats(canonicalName: string): TeamWorldCupStats {
  return {
    canonicalName,
    displayName: canonicalName,
    titles: 0,
    finalsPlayed: 0,
    participations: 0,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    avgGoalsFor: 0,
    avgGoalsAgainst: 0,
    groupMatches: 0,
    groupWins: 0,
    groupDraws: 0,
    groupLosses: 0,
    knockoutMatches: 0,
    knockoutWins: 0,
    knockoutDraws: 0,
    knockoutLosses: 0,
  }
}

function recordTeamMatch(
  stats: TeamWorldCupStats,
  goalsFor: number,
  goalsAgainst: number,
  won: boolean,
  drew: boolean,
  phase: ReturnType<typeof getHistoricalMatchPhase>,
): void {
  stats.matchesPlayed += 1
  stats.goalsFor += goalsFor
  stats.goalsAgainst += goalsAgainst

  if (won) stats.wins += 1
  else if (drew) stats.draws += 1
  else stats.losses += 1

  const isGroupPhase = phase === 'group' || phase === 'final_round'

  if (isGroupPhase) {
    stats.groupMatches += 1
    if (won) stats.groupWins += 1
    else if (drew) stats.groupDraws += 1
    else stats.groupLosses += 1
    return
  }

  stats.knockoutMatches += 1
  if (won) stats.knockoutWins += 1
  else if (drew) stats.knockoutDraws += 1
  else stats.knockoutLosses += 1
}

function finalizeStats(stats: TeamWorldCupStats): TeamWorldCupStats {
  const winRate = stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0
  const avgGoalsFor = stats.matchesPlayed > 0 ? stats.goalsFor / stats.matchesPlayed : 0
  const avgGoalsAgainst = stats.matchesPlayed > 0 ? stats.goalsAgainst / stats.matchesPlayed : 0

  return {
    ...stats,
    displayName: getHistoricalTeamDisplayName(stats.canonicalName),
    winRate,
    avgGoalsFor,
    avgGoalsAgainst,
  }
}

export function buildTeamWorldCupStats(
  tournaments: Array<{ year: number; matches: HistoricalRawMatch[]; summary: TournamentSummary }>,
): TeamWorldCupStats[] {
  const statsByTeam = new Map<string, TeamWorldCupStats>()
  const participationByYear = new Map<string, Set<number>>()

  function getStats(teamName: string): TeamWorldCupStats {
    const canonical = canonicalizeTeamName(teamName)
    const existing = statsByTeam.get(canonical)
    if (existing) return existing

    const created = createEmptyStats(canonical)
    statsByTeam.set(canonical, created)
    return created
  }

  for (const tournament of tournaments) {
    const teamsInYear = new Set<string>()

    for (const match of tournament.matches) {
      if (!isCountedHistoricalMatch(match)) continue

      const regulation = getRegulationScore(match.score)
      if (!regulation) continue

      const phase = getHistoricalMatchPhase(match)
      const outcome = resolveMatchOutcome(match.score)
      const [homeGoals, awayGoals] = regulation
      const home = getStats(match.team1)
      const away = getStats(match.team2)

      teamsInYear.add(home.canonicalName)
      teamsInYear.add(away.canonicalName)

      const homeWon = outcome === 'team1'
      const awayWon = outcome === 'team2'
      const drew = outcome === 'draw'

      recordTeamMatch(home, homeGoals, awayGoals, homeWon, drew, phase)
      recordTeamMatch(away, awayGoals, homeGoals, awayWon, drew, phase)
    }

    for (const team of teamsInYear) {
      const stats = getStats(team)
      const years = participationByYear.get(team) ?? new Set<number>()
      years.add(tournament.year)
      participationByYear.set(team, years)

      if (tournament.summary.champion === team) {
        stats.titles += 1
      }

      if (isFinalistTeam(tournament.year, tournament.matches, team)) {
        stats.finalsPlayed += 1
      }
    }
  }

  for (const [team, years] of participationByYear.entries()) {
    const stats = getStats(team)
    stats.participations = years.size
  }

  return [...statsByTeam.values()]
    .map(finalizeStats)
    .filter((stats) => stats.matchesPlayed > 0)
    .sort((left, right) => {
      if (right.titles !== left.titles) return right.titles - left.titles
      if (right.finalsPlayed !== left.finalsPlayed) return right.finalsPlayed - left.finalsPlayed
      if (right.winRate !== left.winRate) return right.winRate - left.winRate
      return left.displayName.localeCompare(right.displayName, 'pt-BR')
    })
}

export function summarizeTournaments(
  years: number[],
  matchesByYear: Map<number, HistoricalRawMatch[]>,
): TournamentSummary[] {
  return years.map((year) => extractTournamentSummary(year, matchesByYear.get(year) ?? []))
}
