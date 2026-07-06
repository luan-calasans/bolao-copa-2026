import { getMatchLoser, getMatchWinner } from '../components/knockout/knockoutBracketLayout'
import type { ApiStandingTable } from '../models/api.types'
import type {
  KnockoutBracket,
  KnockoutMatch,
  KnockoutParticipant,
  KnockoutRound,
  KnockoutStage,
} from '../models/knockout'
import type { Match, MatchStatus } from '../models/match'
import type { Team } from '../models/team'
import { isGroupStageComplete } from './knockoutQualifiers'
import { KNOCKOUT_ROUND_LABELS, KNOCKOUT_STAGE_ORDER } from './knockoutBracketTemplate'
import { orderKnockoutRounds } from './knockoutBracketOrdering'
import { generateRoundOf32 } from './roundOf32Generator'
import { isTeamDefined } from './teamDisplay'

const KNOCKOUT_STAGES = new Set<string>(KNOCKOUT_STAGE_ORDER)

function isKnockoutStage(stage: string): stage is KnockoutStage {
  return KNOCKOUT_STAGES.has(stage)
}

function mapApiTeamToTeam(team: Match['homeTeam']): Team {
  return team
}

function createParticipant(
  team: Team | null,
  label: string,
  isProjected: boolean,
): KnockoutParticipant {
  return { team, label, isProjected }
}

function buildProjectedR32Matches(standings: ApiStandingTable[]): KnockoutMatch[] {
  const groupStageComplete = isGroupStageComplete(standings)
  const roundOf32 = generateRoundOf32(standings)

  return roundOf32.map((fixture) => ({
    key: fixture.key,
    matchId: fixture.matchId,
    stage: 'LAST_32' as const,
    home: createParticipant(
      fixture.homeTeam,
      fixture.homeLabel,
      !groupStageComplete || !fixture.homeTeam,
    ),
    away: createParticipant(
      fixture.awayTeam,
      fixture.awayLabel,
      !groupStageComplete || !fixture.awayTeam,
    ),
    score: { home: null, away: null },
    status: 'scheduled' as MatchStatus,
    utcDate: null,
    isProjected: !fixture.isResolved,
  }))
}

function matchFromApi(apiMatch: Match): KnockoutMatch {
  const homeDefined = apiMatch.homeTeam.isDefined
  const awayDefined = apiMatch.awayTeam.isDefined

  return {
    key: `api-${apiMatch.id}`,
    id: apiMatch.id,
    matchday: apiMatch.matchday,
    stage: apiMatch.stage as KnockoutStage,
    home: createParticipant(
      homeDefined ? mapApiTeamToTeam(apiMatch.homeTeam) : null,
      homeDefined
        ? apiMatch.homeTeam.shortName || apiMatch.homeTeam.name
        : 'A definir',
      !homeDefined,
    ),
    away: createParticipant(
      awayDefined ? mapApiTeamToTeam(apiMatch.awayTeam) : null,
      awayDefined
        ? apiMatch.awayTeam.shortName || apiMatch.awayTeam.name
        : 'A definir',
      !awayDefined,
    ),
    score: { ...apiMatch.score },
    penalties: apiMatch.penalties ?? null,
    extraTime: apiMatch.extraTime ?? null,
    status: apiMatch.status,
    utcDate: apiMatch.utcDate,
    isProjected: false,
  }
}

function participantKey(participant: KnockoutParticipant): string {
  const team = participant.team
  if (team?.id != null) return `id:${team.id}`
  return `label:${participant.label}`
}

function parseFifaMatchNumber(matchId: string | undefined): number | null {
  if (!matchId) return null
  const value = Number(matchId.replace(/^M/i, ''))
  return Number.isFinite(value) ? value : null
}

function findApiMatchForProjected(
  projected: KnockoutMatch,
  apiMatches: KnockoutMatch[],
): KnockoutMatch | undefined {
  const fifaNumber = parseFifaMatchNumber(projected.matchId)
  if (fifaNumber != null) {
    const byMatchday = apiMatches.find((match) => match.matchday === fifaNumber)
    if (byMatchday) return byMatchday
  }

  const projectedHome = participantKey(projected.home)
  const projectedAway = participantKey(projected.away)

  if (!projected.home.team || !projected.away.team) {
    return undefined
  }

  return apiMatches.find((match) => {
    const apiHome = participantKey(match.home)
    const apiAway = participantKey(match.away)
    return (
      (apiHome === projectedHome && apiAway === projectedAway) ||
      (apiHome === projectedAway && apiAway === projectedHome)
    )
  })
}

function shouldSwapScores(projected: KnockoutMatch, apiMatch: KnockoutMatch): boolean {
  if (!projected.home.team || !projected.away.team) return false
  if (!apiMatch.home.team || !apiMatch.away.team) return false
  return participantKey(projected.home) !== participantKey(apiMatch.home)
}

function areTeamsSwapped(projected: KnockoutMatch, apiMatch: KnockoutMatch): boolean {
  return shouldSwapScores(projected, apiMatch)
}

function mergeApiScore(
  projected: KnockoutMatch,
  apiMatch: KnockoutMatch,
): { home: number | null; away: number | null } {
  const { score } = apiMatch
  if (score.home == null && score.away == null) {
    return projected.score
  }

  const swapped = areTeamsSwapped(projected, apiMatch)

  return swapped
    ? { home: score.away, away: score.home }
    : { home: score.home, away: score.away }
}

function mergeApiSideScore(
  projected: KnockoutMatch,
  apiMatch: KnockoutMatch,
  detail: { home: number | null; away: number | null } | null | undefined,
): { home: number | null; away: number | null } | null | undefined {
  if (!detail || (detail.home == null && detail.away == null)) {
    return undefined
  }

  const swapped = areTeamsSwapped(projected, apiMatch)

  return swapped
    ? { home: detail.away, away: detail.home }
    : { home: detail.home, away: detail.away }
}

function findApiParticipantForProjected(
  projected: KnockoutParticipant,
  apiMatch: KnockoutMatch,
): KnockoutParticipant | undefined {
  if (!projected.team) return undefined

  const projectedKey = participantKey(projected)

  if (apiMatch.home.team && participantKey(apiMatch.home) === projectedKey) {
    return apiMatch.home
  }

  if (apiMatch.away.team && participantKey(apiMatch.away) === projectedKey) {
    return apiMatch.away
  }

  return undefined
}

function mergeParticipant(
  projected: KnockoutParticipant,
  apiMatch: KnockoutMatch,
  slot: 'home' | 'away',
): KnockoutParticipant {
  const api =
    findApiParticipantForProjected(projected, apiMatch) ??
    (projected.team ? undefined : apiMatch[slot])

  if (api?.team && isTeamDefined(api.team)) {
    return { ...api, isProjected: false }
  }

  if (projected.team && isTeamDefined(projected.team) && !projected.isProjected) {
    return projected
  }

  return api?.team && isTeamDefined(api.team) ? api : projected
}

function mergeKnockoutMatch(projected: KnockoutMatch, apiMatch: KnockoutMatch): KnockoutMatch {
  return {
    ...projected,
    id: apiMatch.id ?? projected.id,
    matchday: apiMatch.matchday ?? projected.matchday,
    home: mergeParticipant(projected.home, apiMatch, 'home'),
    away: mergeParticipant(projected.away, apiMatch, 'away'),
    score: mergeApiScore(projected, apiMatch),
    penalties: mergeApiSideScore(projected, apiMatch, apiMatch.penalties) ?? projected.penalties,
    extraTime: mergeApiSideScore(projected, apiMatch, apiMatch.extraTime) ?? projected.extraTime,
    status: apiMatch.status,
    utcDate: apiMatch.utcDate ?? projected.utcDate,
    isProjected: projected.isProjected && apiMatch.status !== 'finished',
  }
}

function mergeProjectedRound(
  projectedMatches: KnockoutMatch[],
  apiMatches: KnockoutMatch[],
): KnockoutMatch[] {
  if (apiMatches.length === 0) {
    return projectedMatches
  }

  return projectedMatches.map((projected) => {
    const apiMatch = findApiMatchForProjected(projected, apiMatches)
    if (!apiMatch) return projected
    return mergeKnockoutMatch(projected, apiMatch)
  })
}

function mergeR32Matches(
  apiMatches: KnockoutMatch[],
  projectedMatches: KnockoutMatch[],
): KnockoutMatch[] {
  return mergeProjectedRound(projectedMatches, apiMatches)
}

function buildWinnerSlot(
  sourceMatch: KnockoutMatch | undefined,
  fallbackLabel: string,
): KnockoutParticipant {
  const winner = sourceMatch ? getMatchWinner(sourceMatch) : null

  if (winner?.team) {
    return createParticipant(winner.team, winner.team.shortName || winner.team.name, false)
  }

  return createParticipant(null, fallbackLabel, true)
}

function buildLoserSlot(
  sourceMatch: KnockoutMatch | undefined,
  fallbackLabel: string,
): KnockoutParticipant {
  const loser = sourceMatch ? getMatchLoser(sourceMatch) : null

  if (loser?.team) {
    return createParticipant(loser.team, loser.team.shortName || loser.team.name, false)
  }

  return createParticipant(null, fallbackLabel, true)
}

function buildProjectedThirdPlaceRound(
  semiMatches: KnockoutMatch[],
  stageKey: string,
): KnockoutMatch[] {
  const homeSource = semiMatches[0]
  const awaySource = semiMatches[1]

  return [
    {
      key: `${stageKey}-01`,
      stage: 'THIRD_PLACE',
      home: buildLoserSlot(homeSource, 'Perdedor semifinal 1'),
      away: buildLoserSlot(awaySource, 'Perdedor semifinal 2'),
      score: { home: null, away: null },
      status: 'scheduled' as MatchStatus,
      utcDate: null,
      isProjected: true,
    },
  ]
}

function buildProjectedLaterRound(
  stage: KnockoutStage,
  previousMatches: KnockoutMatch[],
  matchCount: number,
  stageKey: string,
): KnockoutMatch[] {
  const matches: KnockoutMatch[] = []

  for (let index = 0; index < matchCount; index += 1) {
    const homeSource = previousMatches[index * 2]
    const awaySource = previousMatches[index * 2 + 1]

    matches.push({
      key: `${stageKey}-${String(index + 1).padStart(2, '0')}`,
      stage,
      home: buildWinnerSlot(homeSource, `Vencedor jogo ${index * 2 + 1}`),
      away: buildWinnerSlot(awaySource, `Vencedor jogo ${index * 2 + 2}`),
      score: { home: null, away: null },
      status: 'scheduled' as MatchStatus,
      utcDate: null,
      isProjected: true,
    })
  }

  return matches
}

function groupApiKnockoutMatches(matches: Match[]): Map<KnockoutStage, KnockoutMatch[]> {
  const grouped = new Map<KnockoutStage, KnockoutMatch[]>()

  for (const match of matches) {
    if (!isKnockoutStage(match.stage)) continue

    const bucket = grouped.get(match.stage) ?? []
    bucket.push(matchFromApi(match))
    grouped.set(match.stage, bucket)
  }

  for (const [stage, stageMatches] of grouped) {
    grouped.set(
      stage,
      stageMatches.sort((a, b) => {
        const dateA = a.utcDate ? new Date(a.utcDate).getTime() : Number.MAX_SAFE_INTEGER
        const dateB = b.utcDate ? new Date(b.utcDate).getTime() : Number.MAX_SAFE_INTEGER
        return dateA - dateB
      }),
    )
  }

  return grouped
}

export function buildKnockoutBracket(
  standings: ApiStandingTable[],
  matches: Match[],
): KnockoutBracket {
  const apiByStage = groupApiKnockoutMatches(matches)
  const projectedR32 = buildProjectedR32Matches(standings)
  const r32Matches = mergeR32Matches(apiByStage.get('LAST_32') ?? [], projectedR32)

  const rounds: KnockoutRound[] = []
  let previousMatches = r32Matches

  for (const stage of KNOCKOUT_STAGE_ORDER) {
    const apiMatches = apiByStage.get(stage) ?? []
    let roundMatches: KnockoutMatch[]

    if (stage === 'LAST_32') {
      roundMatches = r32Matches
    } else {
      let projected: KnockoutMatch[]

      if (stage === 'THIRD_PLACE') {
        projected = buildProjectedThirdPlaceRound(previousMatches.slice(-2), stage.toLowerCase())
      } else if (stage === 'FINAL') {
        projected = buildProjectedLaterRound(stage, previousMatches.slice(-2), 1, stage.toLowerCase())
      } else {
        const matchCount = stage === 'LAST_16' ? 8 : stage === 'QUARTER_FINALS' ? 4 : 2
        projected = buildProjectedLaterRound(stage, previousMatches, matchCount, stage.toLowerCase())
      }

      roundMatches = mergeProjectedRound(projected, apiMatches)

      if (stage !== 'THIRD_PLACE') {
        previousMatches = roundMatches
      }
    }

    if (roundMatches.length === 0) continue

    rounds.push({
      stage,
      label: KNOCKOUT_ROUND_LABELS[stage] ?? stage,
      matches: roundMatches,
    })
  }

  return { rounds: orderKnockoutRounds(rounds) }
}

export function getKnockoutMatches(matches: Match[]): Match[] {
  return matches.filter((match) => isKnockoutStage(match.stage))
}
