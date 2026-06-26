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
import {
  buildGroupSnapshots,
  formatGroupPositionLabel,
  formatThirdSlotLabel,
  getQualifiedThirdGroups,
  getStandingRowByGroupPosition,
  isGroupStageComplete,
  rankThirdPlaceTeams,
} from './knockoutQualifiers'
import {
  KNOCKOUT_ROUND_LABELS,
  KNOCKOUT_STAGE_ORDER,
  R32_TEMPLATE,
  groupCodeFromKey,
  type BracketSlot,
  type GroupCode,
  type R32TemplateMatch,
} from './knockoutBracketTemplate'
import { orderKnockoutRounds } from './knockoutBracketOrdering'

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

function mapStandingRowToTeam(row: { team: ApiStandingTable['table'][number]['team'] }): Team | null {
  const name = row.team.name?.trim() || ''
  const id = row.team.id

  if (id == null || !name) return null

  return {
    id,
    name,
    shortName: row.team.shortName?.trim() || name,
    tla: row.team.tla?.trim() || '',
    crest: row.team.crest?.trim() || '',
    isDefined: true,
  }
}

function resolveGroupPositionSlot(
  slot: Extract<BracketSlot, { kind: 'groupPos' }>,
  snapshots: ReturnType<typeof buildGroupSnapshots>,
  groupStageComplete: boolean,
): KnockoutParticipant {
  const row = getStandingRowByGroupPosition(snapshots, slot.group, slot.position)
  const label = formatGroupPositionLabel(slot.group, slot.position)
  const team = row ? mapStandingRowToTeam(row) : null

  return createParticipant(team, team ? label : label, !groupStageComplete || !team)
}

function resolveThirdSlots(
  templates: R32TemplateMatch[],
  snapshots: ReturnType<typeof buildGroupSnapshots>,
  groupStageComplete: boolean,
): Map<string, KnockoutParticipant> {
  const rankedThirds = rankThirdPlaceTeams(snapshots)
  const qualifiedGroups = getQualifiedThirdGroups(snapshots)
  const assignedGroups = new Set<GroupCode>()
  const resolved = new Map<string, KnockoutParticipant>()

  const thirdSlots = templates.flatMap((template) => {
    const slots: Array<{ key: string; side: 'home' | 'away'; eligible: GroupCode[] }> = []

    if (template.home.kind === 'third') {
      slots.push({ key: template.key, side: 'home', eligible: template.home.eligible })
    }

    if (template.away.kind === 'third') {
      slots.push({ key: template.key, side: 'away', eligible: template.away.eligible })
    }

    return slots
  })

  for (const slot of thirdSlots) {
    const label = formatThirdSlotLabel(slot.eligible)
    const candidate = rankedThirds.find((row) => {
      const group = snapshots.find((snapshot) => snapshot.third?.team.id === row.team.id)?.group
      if (!group || !qualifiedGroups.has(group)) return false
      if (!slot.eligible.includes(group)) return false
      if (assignedGroups.has(group)) return false
      return true
    })

    if (!candidate) {
      resolved.set(`${slot.key}:${slot.side}`, createParticipant(null, label, true))
      continue
    }

    const group = snapshots.find((snapshot) => snapshot.third?.team.id === candidate.team.id)?.group
    if (!group) {
      resolved.set(`${slot.key}:${slot.side}`, createParticipant(null, label, true))
      continue
    }

    assignedGroups.add(group)
    const team = mapStandingRowToTeam(candidate)
    resolved.set(
      `${slot.key}:${slot.side}`,
      createParticipant(team, formatGroupPositionLabel(group, 3), !groupStageComplete),
    )
  }

  return resolved
}

function buildProjectedR32Matches(
  standings: ApiStandingTable[],
  groupStageComplete: boolean,
): KnockoutMatch[] {
  const snapshots = buildGroupSnapshots(standings)
  const thirdParticipants = resolveThirdSlots(R32_TEMPLATE, snapshots, groupStageComplete)

  return R32_TEMPLATE.map((template) => {
    const resolveSlot = (slot: BracketSlot, side: 'home' | 'away'): KnockoutParticipant => {
      if (slot.kind === 'third') {
        return (
          thirdParticipants.get(`${template.key}:${side}`) ??
          createParticipant(null, formatThirdSlotLabel(slot.eligible), true)
        )
      }

      return resolveGroupPositionSlot(slot, snapshots, groupStageComplete)
    }

    const home = resolveSlot(template.home, 'home')
    const away = resolveSlot(template.away, 'away')

    return {
      key: template.key,
      stage: 'LAST_32',
      home,
      away,
      score: { home: null, away: null },
      status: 'scheduled',
      utcDate: null,
      isProjected: home.isProjected || away.isProjected,
    }
  })
}

function matchFromApi(apiMatch: Match): KnockoutMatch {
  const homeDefined = apiMatch.homeTeam.isDefined
  const awayDefined = apiMatch.awayTeam.isDefined

  return {
    key: `api-${apiMatch.id}`,
    id: apiMatch.id,
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
    status: apiMatch.status,
    utcDate: apiMatch.utcDate,
    isProjected: false,
  }
}

function mergeR32Matches(
  apiMatches: KnockoutMatch[],
  projectedMatches: KnockoutMatch[],
): KnockoutMatch[] {
  if (apiMatches.length === 0) {
    return projectedMatches
  }

  if (apiMatches.length >= 16) {
    return apiMatches
      .sort((a, b) => {
        const dateA = a.utcDate ? new Date(a.utcDate).getTime() : Number.MAX_SAFE_INTEGER
        const dateB = b.utcDate ? new Date(b.utcDate).getTime() : Number.MAX_SAFE_INTEGER
        return dateA - dateB
      })
      .map((match, index) => ({
        ...match,
        key: projectedMatches[index]?.key ?? match.key,
      }))
  }

  return projectedMatches.map((projected, index) => {
    const apiMatch = apiMatches[index]
    if (!apiMatch) return projected

    return {
      ...projected,
      id: apiMatch.id,
      home: apiMatch.home.team ? apiMatch.home : projected.home,
      away: apiMatch.away.team ? apiMatch.away : projected.away,
      score: apiMatch.score.home != null || apiMatch.score.away != null ? apiMatch.score : projected.score,
      status: apiMatch.status,
      utcDate: apiMatch.utcDate ?? projected.utcDate,
      isProjected: projected.isProjected && !apiMatch.home.team && !apiMatch.away.team,
    }
  })
}

function getMatchWinner(match: KnockoutMatch): Team | null {
  if (match.status !== 'finished') return null

  const { home, away } = match.score
  if (home == null || away == null) return null
  if (home === away) return null

  return home > away ? match.home.team : match.away.team
}

function buildWinnerSlot(
  sourceMatch: KnockoutMatch | undefined,
  fallbackLabel: string,
): KnockoutParticipant {
  const winner = sourceMatch ? getMatchWinner(sourceMatch) : null

  if (winner) {
    return createParticipant(winner, winner.shortName || winner.name, false)
  }

  return createParticipant(null, fallbackLabel, true)
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
  const groupStageComplete = isGroupStageComplete(standings)
  const apiByStage = groupApiKnockoutMatches(matches)

  const projectedR32 = buildProjectedR32Matches(standings, groupStageComplete)
  const r32Matches = mergeR32Matches(apiByStage.get('LAST_32') ?? [], projectedR32)

  const rounds: KnockoutRound[] = []
  let previousMatches = r32Matches

  for (const stage of KNOCKOUT_STAGE_ORDER) {
    const apiMatches = apiByStage.get(stage) ?? []
    let roundMatches: KnockoutMatch[]

    if (stage === 'LAST_32') {
      roundMatches = r32Matches
    } else if (apiMatches.length > 0) {
      roundMatches = apiMatches
      previousMatches = roundMatches
    } else if (stage === 'THIRD_PLACE' || stage === 'FINAL') {
      roundMatches = buildProjectedLaterRound(stage, previousMatches.slice(-2), 1, stage.toLowerCase())
    } else {
      const matchCount = stage === 'LAST_16' ? 8 : stage === 'QUARTER_FINALS' ? 4 : 2
      roundMatches = buildProjectedLaterRound(stage, previousMatches, matchCount, stage.toLowerCase())
      previousMatches = roundMatches
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

export { groupCodeFromKey }
