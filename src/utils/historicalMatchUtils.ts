import type {
  HistoricalMatchPhase,
  HistoricalRawMatch,
  HistoricalScore,
  TournamentSummary,
} from '../models/historicalWorldCup'
import { canonicalizeTeamName } from './historicalTeamNames'

export type MatchOutcome = 'team1' | 'team2' | 'draw' | null

export function getRegulationScore(score: HistoricalScore | null | undefined): [number, number] | null {
  if (!score?.ft || score.ft.length !== 2) return null
  return score.ft
}

export function getPenaltyScore(score: HistoricalScore | null | undefined): [number, number] | null {
  if (!score?.p || score.p.length !== 2) return null
  return score.p
}

export function getExtraTimeScore(score: HistoricalScore | null | undefined): [number, number] | null {
  if (!score?.et || score.et.length !== 2) return null
  return score.et
}

export function resolveMatchOutcome(score: HistoricalScore | null | undefined): MatchOutcome {
  if (!score) return null

  const regulation = getRegulationScore(score)
  if (!regulation) return null

  const [home, away] = regulation
  if (home > away) return 'team1'
  if (away > home) return 'team2'

  const penalties = getPenaltyScore(score)
  if (penalties) {
    const [penHome, penAway] = penalties
    if (penHome > penAway) return 'team1'
    if (penAway > penHome) return 'team2'
    return 'draw'
  }

  const extraTime = getExtraTimeScore(score)
  if (extraTime) {
    const [etHome, etAway] = extraTime
    if (etHome > etAway) return 'team1'
    if (etAway > etHome) return 'team2'
  }

  return 'draw'
}

export function getWinnerTeamName(match: HistoricalRawMatch): string | null {
  const outcome = resolveMatchOutcome(match.score)
  if (outcome === 'team1') return canonicalizeTeamName(match.team1)
  if (outcome === 'team2') return canonicalizeTeamName(match.team2)
  return null
}

export function getLoserTeamName(match: HistoricalRawMatch): string | null {
  const outcome = resolveMatchOutcome(match.score)
  if (outcome === 'team1') return canonicalizeTeamName(match.team2)
  if (outcome === 'team2') return canonicalizeTeamName(match.team1)
  return null
}

export function formatHistoricalScore(score: HistoricalScore | null | undefined): string | null {
  if (!score) return null

  const regulation = getRegulationScore(score)
  if (!regulation) return null

  const [home, away] = regulation
  const penalties = getPenaltyScore(score)
  const extraTime = getExtraTimeScore(score)

  if (penalties && home === away) {
    return `${home}×${away} (${penalties[0]}×${penalties[1]} nos pênaltis)`
  }

  if (extraTime && home === away) {
    return `${home}×${away} (${extraTime[0]}×${extraTime[1]} na prorrogação)`
  }

  return `${home}×${away}`
}

function isKnockoutRound(round: string): boolean {
  const normalized = round.toLowerCase()

  return (
    normalized.includes('round of 16') ||
    normalized.includes('quarter') ||
    normalized.includes('semi') ||
    normalized.includes('third') ||
    normalized === 'final' ||
    normalized.includes('preliminary round')
  )
}

export function isCountedHistoricalMatch(match: HistoricalRawMatch): boolean {
  const status = match.status?.toLowerCase()
  if (status === 'canceled' || status === 'cancelled') return false

  return getRegulationScore(match.score) != null || getPenaltyScore(match.score) != null
}

export function getHistoricalMatchPhase(match: HistoricalRawMatch): HistoricalMatchPhase {
  if (match.round === 'Final Round') return 'final_round'
  if (isKnockoutRound(match.round)) return 'knockout'
  if (match.group || /matchday/i.test(match.round)) return 'group'
  return 'knockout'
}

interface MiniLeagueRow {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

function buildMiniLeagueStandings(matches: HistoricalRawMatch[]): MiniLeagueRow[] {
  const rows = new Map<string, MiniLeagueRow>()

  function getRow(teamName: string): MiniLeagueRow {
    const canonical = canonicalizeTeamName(teamName)
    const existing = rows.get(canonical)

    if (existing) return existing

    const created: MiniLeagueRow = {
      team: canonical,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    }

    rows.set(canonical, created)
    return created
  }

  for (const match of matches) {
    const regulation = getRegulationScore(match.score)
    if (!regulation) continue

    const [homeGoals, awayGoals] = regulation
    const home = getRow(match.team1)
    const away = getRow(match.team2)

    home.played += 1
    away.played += 1
    home.goalsFor += homeGoals
    home.goalsAgainst += awayGoals
    away.goalsFor += awayGoals
    away.goalsAgainst += homeGoals

    const outcome = resolveMatchOutcome(match.score)

    if (outcome === 'team1') {
      home.won += 1
      away.lost += 1
      home.points += 2
    } else if (outcome === 'team2') {
      away.won += 1
      home.lost += 1
      away.points += 2
    } else {
      home.drawn += 1
      away.drawn += 1
      home.points += 1
      away.points += 1
    }
  }

  return [...rows.values()].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points
    const leftGd = left.goalsFor - left.goalsAgainst
    const rightGd = right.goalsFor - right.goalsAgainst
    if (rightGd !== leftGd) return rightGd - leftGd
    if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor
    return left.team.localeCompare(right.team, 'pt-BR')
  })
}

function extract1950Summary(matches: HistoricalRawMatch[]): TournamentSummary {
  const finalRoundMatches = matches.filter((match) => match.round === 'Final Round')
  const standings = buildMiniLeagueStandings(finalRoundMatches)
  const champion = standings[0]?.team ?? 'Uruguay'
  const runnerUp = standings[1]?.team ?? null
  const decisiveMatch = finalRoundMatches.find(
    (match) =>
      canonicalizeTeamName(match.team1) === champion &&
      canonicalizeTeamName(match.team2) === runnerUp,
  ) ?? finalRoundMatches.at(-1)

  return {
    year: 1950,
    champion,
    runnerUp,
    finalScore: decisiveMatch ? formatHistoricalScore(decisiveMatch.score) : null,
    hostNote: 'Formato de grupo final (sem final única)',
  }
}

export function extractTournamentSummary(year: number, matches: HistoricalRawMatch[]): TournamentSummary {
  if (year === 1950) {
    return extract1950Summary(matches)
  }

  const finalMatch = matches.find((match) => match.round === 'Final')

  if (!finalMatch) {
    return {
      year,
      champion: '—',
      runnerUp: null,
      finalScore: null,
    }
  }

  return {
    year,
    champion: getWinnerTeamName(finalMatch) ?? '—',
    runnerUp: getLoserTeamName(finalMatch),
    finalScore: formatHistoricalScore(finalMatch.score),
  }
}

export function isFinalistTeam(year: number, matches: HistoricalRawMatch[], teamName: string): boolean {
  const canonical = canonicalizeTeamName(teamName)

  if (year === 1950) {
    const standings = buildMiniLeagueStandings(matches.filter((match) => match.round === 'Final Round'))
    return standings.slice(0, 2).some((row) => row.team === canonical)
  }

  const finalMatch = matches.find((match) => match.round === 'Final')
  if (!finalMatch) return false

  return (
    canonicalizeTeamName(finalMatch.team1) === canonical ||
    canonicalizeTeamName(finalMatch.team2) === canonical
  )
}
