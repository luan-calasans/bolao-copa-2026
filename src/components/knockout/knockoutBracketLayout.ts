import type { KnockoutMatch, KnockoutParticipant, KnockoutRound } from '../../models/knockout'
import { isTeamDefined } from '../../utils/teamDisplay'

export const BRACKET_TEAM_ROWS = 16
export const BRACKET_ROUNDS_PER_SIDE = 4

export interface BracketDimensions {
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

const MAIN_BRACKET_STAGES = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS'] as const

export type BracketSide = 'left' | 'right'

export function computeBracketDimensions(containerWidth: number): BracketDimensions {
  const width = Math.max(Math.round(containerWidth), 1)
  const initialCenter = Math.max(160, Math.round(width * 0.11))
  const remaining = width - initialCenter
  const teamColWidth = Math.max(48, Math.round(remaining * 0.085))
  const roundColWidth = Math.floor((remaining - 2 * teamColWidth) / 8)
  const halfWidth = teamColWidth + BRACKET_ROUNDS_PER_SIDE * roundColWidth
  const centerWidth = width - halfWidth * 2
  const totalWidth = width

  const nodeSize = Math.min(56, Math.max(44, Math.round(width / 26)))
  const teamCrestSize = nodeSize - 6
  const nodeCrestSize = nodeSize - 12
  const intraPairGap = 10
  const rowHeight = teamCrestSize + intraPairGap
  const pairGap = 18
  const pairStride = 2 * rowHeight + intraPairGap + pairGap
  const height = (BRACKET_TEAM_ROWS / 2) * pairStride - pairGap
  const trophySize = Math.min(112, Math.max(80, Math.round(centerWidth * 0.5)))

  const leftRoundXs = Array.from(
    { length: BRACKET_ROUNDS_PER_SIDE },
    (_, index) => teamColWidth + index * roundColWidth + roundColWidth / 2,
  )
  const rightRoundXs = Array.from(
    { length: BRACKET_ROUNDS_PER_SIDE },
    (_, index) =>
      halfWidth + centerWidth + (BRACKET_ROUNDS_PER_SIDE - 1 - index) * roundColWidth + roundColWidth / 2,
  )

  return {
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

function getPairStride(rowHeight: number, intraPairGap: number, pairGap: number): number {
  return 2 * rowHeight + intraPairGap + pairGap
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
): number {
  const outermostNodes = BRACKET_TEAM_ROWS / 2
  const pairStride = getPairStride(rowHeight, intraPairGap, pairGap)

  if (nodesInRound === outermostNodes) {
    return nodeIndex * pairStride + rowHeight + intraPairGap / 2
  }

  if (nodesInRound === 1) {
    return (outermostNodes * pairStride - pairGap) / 2
  }

  const childY1 = getNodeCenterY(nodeIndex * 2, nodesInRound * 2, rowHeight, pairGap, intraPairGap)
  const childY2 = getNodeCenterY(nodeIndex * 2 + 1, nodesInRound * 2, rowHeight, pairGap, intraPairGap)
  return (childY1 + childY2) / 2
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

export function getMainBracketRounds(rounds: KnockoutRound[]) {
  return MAIN_BRACKET_STAGES.map((stage) => getRoundByStage(rounds, stage)).filter(
    (round): round is KnockoutRound => round != null,
  )
}

export function getFinalMatch(rounds: KnockoutRound[]): KnockoutMatch | undefined {
  return getRoundByStage(rounds, 'FINAL')?.matches[0]
}
