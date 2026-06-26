import type { KnockoutMatch, KnockoutParticipant, KnockoutRound, KnockoutStage } from '../../models/knockout'
import { isTeamDefined } from '../../utils/teamDisplay'

const KNOCKOUT_STAGE_ORDER: KnockoutStage[] = [
  'LAST_32',
  'LAST_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
]

export type BracketProfileKind = 'knockout' | 'finalists' | 'final_round'

export interface BracketProfile {
  kind: BracketProfileKind
  teamRows: number
  roundsPerSide: number
  stages: KnockoutStage[]
  seedParticipants?: KnockoutParticipant[]
}

export interface BracketDimensions {
  profile: BracketProfile
  rowHeight: number
  height: number
  nodeSize: number
  teamColWidth: number
  roundColWidth: number
  centerWidth: number
  trophySize: number
  totalWidth: number
  teamCrestSize: number
  nodeCrestSize: number
  pairGap: number
  intraPairGap: number
  leftRoundXs: number[]
  rightRoundXs: number[]
  leftTeamX: number
  rightTeamX: number
  centerX: number
}

export type BracketSide = 'left' | 'right'

function getPairStride(rowHeight: number, intraPairGap: number, pairGap: number): number {
  return 2 * rowHeight + intraPairGap + pairGap
}

function collectUniqueParticipants(matches: KnockoutMatch[]): KnockoutParticipant[] {
  const seen = new Map<string, KnockoutParticipant>()

  for (const match of matches) {
    for (const participant of [match.home, match.away]) {
      const key = participant.team?.name ?? participant.label
      if (!seen.has(key)) {
        seen.set(key, participant)
      }
    }
  }

  return [...seen.values()].sort((left, right) =>
    (left.team?.name ?? left.label).localeCompare(right.team?.name ?? right.label, 'pt-BR'),
  )
}

function isFinalRoundGroup(round: KnockoutRound): boolean {
  return round.stage === 'SEMI_FINALS' && round.matches.length > 2
}

export function deriveBracketProfile(rounds: KnockoutRound[]): BracketProfile | null {
  const knockoutStages = KNOCKOUT_STAGE_ORDER.map((stage) => ({
    stage,
    round: getRoundByStage(rounds, stage),
  })).filter(
    (entry): entry is { stage: KnockoutStage; round: KnockoutRound } =>
      entry.round != null && entry.round.matches.length > 0,
  )

  if (knockoutStages.length > 0) {
    const outermost = knockoutStages[0]

    if (knockoutStages.length === 1 && isFinalRoundGroup(outermost.round)) {
      const participants = collectUniqueParticipants(outermost.round.matches)
      if (participants.length < 2) return null

      return {
        kind: 'final_round',
        teamRows: participants.length,
        roundsPerSide: 0,
        stages: [],
        seedParticipants: participants,
      }
    }

    return {
      kind: 'knockout',
      teamRows: outermost.round.matches.length * 2,
      roundsPerSide: knockoutStages.length,
      stages: knockoutStages.map((entry) => entry.stage),
    }
  }

  const final = getFinalMatch(rounds)
  if (final) {
    return {
      kind: 'finalists',
      teamRows: 2,
      roundsPerSide: 0,
      stages: [],
      seedParticipants: [final.home, final.away],
    }
  }

  return null
}

export function supportsDesktopKnockoutLayout(rounds: KnockoutRound[]): boolean {
  return deriveBracketProfile(rounds) != null
}

export function computeBracketDimensions(
  containerWidth: number,
  profile: BracketProfile | null | undefined,
): BracketDimensions | null {
  if (!profile) return null

  const width = Math.max(Math.round(containerWidth), 1)
  const roundsPerSide = profile.roundsPerSide
  const initialCenter = Math.max(160, Math.round(width * 0.11))
  const remaining = width - initialCenter
  const teamColWidth = Math.max(48, Math.round(remaining * 0.085))
  const roundColWidth =
    roundsPerSide > 0
      ? Math.floor((remaining - 2 * teamColWidth) / (roundsPerSide * 2))
      : 0
  const halfWidth = teamColWidth + roundsPerSide * roundColWidth
  const centerWidth = width - halfWidth * 2
  const totalWidth = width

  const nodeSize = Math.min(56, Math.max(44, Math.round(width / 26)))
  const teamCrestSize = nodeSize - 6
  const nodeCrestSize = nodeSize - 12
  const intraPairGap = 10
  const rowHeight = teamCrestSize + intraPairGap
  const pairGap = 18
  const pairStride = getPairStride(rowHeight, intraPairGap, pairGap)
  const height = (profile.teamRows / 2) * pairStride - pairGap
  const trophySize = Math.min(112, Math.max(80, Math.round(centerWidth * 0.5)))

  const leftRoundXs = Array.from(
    { length: roundsPerSide },
    (_, index) => teamColWidth + index * roundColWidth + roundColWidth / 2,
  )
  const rightRoundXs = Array.from(
    { length: roundsPerSide },
    (_, index) =>
      halfWidth + centerWidth + (roundsPerSide - 1 - index) * roundColWidth + roundColWidth / 2,
  )

  return {
    profile,
    rowHeight,
    height,
    nodeSize,
    teamColWidth,
    roundColWidth,
    centerWidth,
    trophySize,
    totalWidth,
    teamCrestSize,
    nodeCrestSize,
    pairGap,
    intraPairGap,
    leftRoundXs,
    rightRoundXs,
    leftTeamX: teamColWidth / 2,
    rightTeamX: totalWidth - teamColWidth / 2,
    centerX: halfWidth + centerWidth / 2,
  }
}

export function getTeamRowY(
  rowIndex: number,
  rowHeight: number,
  pairGap: number,
  intraPairGap: number,
): number {
  const pairIndex = Math.floor(rowIndex / 2)
  const rowInPair = rowIndex % 2
  const pairStride = getPairStride(rowHeight, intraPairGap, pairGap)

  return pairIndex * pairStride + rowInPair * (rowHeight + intraPairGap) + rowHeight / 2
}

export function getNodeCenterY(
  nodeIndex: number,
  nodesInRound: number,
  rowHeight: number,
  pairGap: number,
  intraPairGap: number,
  outermostNodes: number,
): number {
  const pairStride = getPairStride(rowHeight, intraPairGap, pairGap)
  const bracketHeight = Math.max(outermostNodes * pairStride - pairGap, rowHeight)

  if (nodesInRound <= 1) {
    return bracketHeight / 2
  }

  if (nodesInRound === outermostNodes) {
    return nodeIndex * pairStride + rowHeight + intraPairGap / 2
  }

  if (nodesInRound * 2 <= outermostNodes) {
    const childY1 = getNodeCenterY(
      nodeIndex * 2,
      nodesInRound * 2,
      rowHeight,
      pairGap,
      intraPairGap,
      outermostNodes,
    )
    const childY2 = getNodeCenterY(
      nodeIndex * 2 + 1,
      nodesInRound * 2,
      rowHeight,
      pairGap,
      intraPairGap,
      outermostNodes,
    )
    return (childY1 + childY2) / 2
  }

  const step = bracketHeight / (nodesInRound - 1)
  return nodeIndex * step
}

export function getSeedSlotY(slotIndex: number, slotCount: number, dimensions: BracketDimensions): number {
  if (slotCount <= 1) {
    return dimensions.height / 2
  }

  const step = dimensions.height / (slotCount - 1)
  return slotIndex * step
}

export function getRoundColumnX(side: BracketSide, roundIndex: number, dimensions: BracketDimensions): number {
  return side === 'left' ? dimensions.leftRoundXs[roundIndex] : dimensions.rightRoundXs[roundIndex]
}

export function getRoundByStage(rounds: KnockoutRound[], stage: string): KnockoutRound | undefined {
  return rounds.find((round) => round.stage === stage)
}

export function getSideMatches(matches: KnockoutMatch[], side: BracketSide): KnockoutMatch[] {
  if (matches.length <= 1) return matches

  const half = matches.length / 2
  const left = matches.slice(0, half)
  const right = matches.slice(half).reverse()

  return side === 'left' ? left : right
}

export function getSideSeedParticipants(
  participants: KnockoutParticipant[],
  side: BracketSide,
): KnockoutParticipant[] {
  const half = participants.length / 2
  const left = participants.slice(0, half)
  const right = participants.slice(half).reverse()

  return side === 'left' ? left : right
}

export function getSideTeamSlots(matches: KnockoutMatch[]): Array<{
  participant: KnockoutParticipant
  match: KnockoutMatch
  slot: 'home' | 'away'
}> {
  return matches.flatMap((match) => [
    { participant: match.home, match, slot: 'home' as const },
    { participant: match.away, match, slot: 'away' as const },
  ])
}

export function getMatchWinner(match: KnockoutMatch): KnockoutParticipant | null {
  if (match.status !== 'finished') return null

  const { home, away } = match.score
  if (home == null || away == null) return null

  if (home !== away) {
    return home > away ? match.home : match.away
  }

  const penHome = match.penalties?.home
  const penAway = match.penalties?.away

  if (penHome != null && penAway != null && penHome !== penAway) {
    return penHome > penAway ? match.home : match.away
  }

  const etHome = match.extraTime?.home
  const etAway = match.extraTime?.away

  if (etHome != null && etAway != null && etHome !== etAway) {
    return etHome > etAway ? match.home : match.away
  }

  return null
}

export function isKnockoutMatchPlayable(match: KnockoutMatch): boolean {
  if (match.id == null) return false

  return (
    match.home.team != null &&
    match.away.team != null &&
    isTeamDefined(match.home.team) &&
    isTeamDefined(match.away.team)
  )
}

export function getMainBracketRounds(rounds: KnockoutRound[], profile: BracketProfile) {
  return profile.stages
    .map((stage) => getRoundByStage(rounds, stage))
    .filter((round): round is KnockoutRound => round != null)
}

export function getFinalMatch(rounds: KnockoutRound[]): KnockoutMatch | undefined {
  return getRoundByStage(rounds, 'FINAL')?.matches[0]
}
