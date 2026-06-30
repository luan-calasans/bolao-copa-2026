import type {
  KnockoutMatch,
  KnockoutParticipant,
  KnockoutRound,
  KnockoutStage,
} from '../../models/knockout'
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
  centerPodWidth: number
  centerPodHeight: number
  centerPodCenterY: number
  centerPodBottom: number
  matchupCrestSize: number
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
      teamRows: outermost.round.matches.length,
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
  options: { semiCount?: number; hasThirdPlace?: boolean } = {},
): BracketDimensions | null {
  const semiCount = options.semiCount ?? 0
  const hasThirdPlace = options.hasThirdPlace ?? false
  if (!profile) return null

  const width = Math.max(Math.round(containerWidth), 1)
  const roundsPerSide = profile.roundsPerSide
  const initialCenter = Math.max(160, Math.round(width * 0.11))
  const remaining = width - initialCenter
  const teamColWidth = Math.max(48, Math.round(remaining * 0.085))
  const roundColWidth =
    roundsPerSide > 0 ? Math.floor((remaining - 2 * teamColWidth) / (roundsPerSide * 2)) : 0
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
  const matchupCrestSize = Math.min(48, Math.max(36, Math.round(nodeSize * 0.82)))
  const matchupRowHeight = matchupCrestSize + 12
  const semiBlockHeight = semiCount > 0 ? 22 + semiCount * matchupRowHeight + 6 : 0
  const finalBlockHeight = 22 + matchupRowHeight + 6
  const thirdPlaceBlockHeight = hasThirdPlace ? 22 + matchupRowHeight + 6 : 0
  const centerPodHeight = semiBlockHeight + finalBlockHeight + thirdPlaceBlockHeight
  const centerPodWidth = Math.max(trophySize + 48, semiCount > 0 ? 168 : trophySize + 32)
  const centerPodCenterY = height / 2
  const centerPodBottom = centerPodCenterY + centerPodHeight / 2

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
    centerPodWidth,
    centerPodHeight,
    centerPodCenterY,
    centerPodBottom,
    matchupCrestSize,
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

  if (nodesInRound === outermostNodes) {
    return nodeIndex * pairStride + rowHeight + intraPairGap / 2
  }

  if (nodesInRound === 1) {
    return (outermostNodes * pairStride - pairGap) / 2
  }

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

export function getSeedSlotY(
  slotIndex: number,
  slotCount: number,
  dimensions: BracketDimensions,
): number {
  if (slotCount <= 1) {
    return dimensions.height / 2
  }

  const step = dimensions.height / (slotCount - 1)
  return slotIndex * step
}

export function getRoundColumnX(
  side: BracketSide,
  roundIndex: number,
  dimensions: BracketDimensions,
): number {
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

  const etHome = match.extraTime?.home
  const etAway = match.extraTime?.away

  if (etHome != null && etAway != null) {
    const totalHome = home + etHome
    const totalAway = away + etAway

    if (totalHome !== totalAway) {
      return totalHome > totalAway ? match.home : match.away
    }
  }

  const penHome = match.penalties?.home
  const penAway = match.penalties?.away

  if (penHome != null && penAway != null && penHome !== penAway) {
    return penHome > penAway ? match.home : match.away
  }

  return null
}

export function getMatchLoser(match: KnockoutMatch): KnockoutParticipant | null {
  const winner = getMatchWinner(match)
  if (!winner) return null
  return winner === match.home ? match.away : match.home
}

export function resolvePickSideForParticipant(
  match: KnockoutMatch,
  participant: KnockoutParticipant,
): 'home' | 'away' | null {
  const participantId = participant.team?.id
  if (participantId != null) {
    if (match.home.team?.id === participantId) return 'home'
    if (match.away.team?.id === participantId) return 'away'
  }

  const participantName = participant.team?.name ?? participant.label
  const homeName = match.home.team?.name ?? match.home.label
  const awayName = match.away.team?.name ?? match.away.label

  if (participantName === homeName) return 'home'
  if (participantName === awayName) return 'away'
  return null
}

export function isKnockoutMatchDefined(match: KnockoutMatch): boolean {
  return (
    match.home.team != null &&
    match.away.team != null &&
    isTeamDefined(match.home.team) &&
    isTeamDefined(match.away.team)
  )
}

export function isKnockoutMatchPlayable(match: KnockoutMatch): boolean {
  if (match.id == null) return false

  return isKnockoutMatchDefined(match)
}

export function getMainBracketRounds(rounds: KnockoutRound[], profile: BracketProfile) {
  return profile.stages
    .map((stage) => getRoundByStage(rounds, stage))
    .filter((round): round is KnockoutRound => round != null)
}

export function getTreeBracketRounds(rounds: KnockoutRound[], profile: BracketProfile) {
  return getMainBracketRounds(rounds, profile).filter((round) => round.stage !== 'SEMI_FINALS')
}

export function getSemiFinalMatches(rounds: KnockoutRound[]): KnockoutMatch[] {
  return getRoundByStage(rounds, 'SEMI_FINALS')?.matches ?? []
}

export function getFinalMatch(rounds: KnockoutRound[]): KnockoutMatch | undefined {
  return getRoundByStage(rounds, 'FINAL')?.matches[0]
}

export function getThirdPlaceMatch(rounds: KnockoutRound[]): KnockoutMatch | undefined {
  return getRoundByStage(rounds, 'THIRD_PLACE')?.matches[0]
}

export function getBracketTotalHeight(dimensions: BracketDimensions): number {
  return Math.max(dimensions.height, dimensions.centerPodBottom + 28)
}

export interface CenterPodConnectorAnchors {
  semiRowYs: number[]
  finalRowY: number
  thirdPlaceRowY: number | null
}

export interface CenterPodConnectorLayout extends CenterPodConnectorAnchors {
  leftEdgeX: number
  rightEdgeX: number
}

/** Y anchors aligned with BracketCenterFinale layout (px-3, gap-2/3, labels). */
export function getCenterPodConnectorAnchors(
  dimensions: BracketDimensions,
  semiCount: number,
  hasThirdPlace: boolean,
): CenterPodConnectorAnchors {
  const podTop = dimensions.centerPodCenterY - dimensions.centerPodHeight / 2
  const crestBlock = dimensions.matchupCrestSize + 4
  const labelBlock = 20
  const podPad = 12
  const outerGap = 12
  const rowGap = 8
  const sectionPad = 12

  let y = podTop + podPad
  const semiRowYs: number[] = []

  if (semiCount > 0) {
    y += labelBlock
    for (let index = 0; index < semiCount; index += 1) {
      semiRowYs.push(y + crestBlock / 2)
      y += crestBlock
      if (index < semiCount - 1) y += rowGap
    }
    y += sectionPad
  }

  y += outerGap + labelBlock
  const finalRowY = y + crestBlock / 2
  y += crestBlock

  let thirdPlaceRowY: number | null = null
  if (hasThirdPlace) {
    y += outerGap + sectionPad + labelBlock
    thirdPlaceRowY = y + crestBlock / 2
  }

  return { semiRowYs, finalRowY, thirdPlaceRowY }
}

export function getCenterPodTargetY(
  anchors: CenterPodConnectorAnchors,
  nodeIndex: number,
  nodesInRound: number,
  side?: BracketSide,
): number {
  const targetIndex =
    side === 'right' && nodesInRound > 1 ? nodesInRound - 1 - nodeIndex : nodeIndex

  if (anchors.semiRowYs.length > 0) {
    if (nodesInRound <= anchors.semiRowYs.length) {
      return anchors.semiRowYs[targetIndex] ?? anchors.semiRowYs[anchors.semiRowYs.length - 1]!
    }

    const step = (anchors.semiRowYs.length - 1) / Math.max(nodesInRound - 1, 1)
    const anchorIndex = Math.round(targetIndex * step)
    return anchors.semiRowYs[anchorIndex] ?? anchors.semiRowYs[anchors.semiRowYs.length - 1]!
  }

  return anchors.finalRowY
}

export function measureCenterPodConnectors(
  container: HTMLElement,
  dimensions: BracketDimensions,
  semiCount: number,
  hasThirdPlace: boolean,
): CenterPodConnectorLayout {
  const fallback = getCenterPodConnectorAnchors(dimensions, semiCount, hasThirdPlace)
  const containerRect = container.getBoundingClientRect()

  const relativeCenterY = (element: Element): number => {
    const rect = element.getBoundingClientRect()
    return rect.top + rect.height / 2 - containerRect.top
  }

  const semiRowYs = Array.from(container.querySelectorAll('[data-bracket-semi-anchor]')).map(
    relativeCenterY,
  )
  const finalEl = container.querySelector('[data-bracket-final-anchor]')
  const thirdEl = container.querySelector('[data-bracket-third-anchor]')
  const podEl = container.querySelector('[data-bracket-center-pod]')

  let leftEdgeX = dimensions.centerX - dimensions.centerPodWidth / 2
  let rightEdgeX = dimensions.centerX + dimensions.centerPodWidth / 2

  if (podEl) {
    const podRect = podEl.getBoundingClientRect()
    leftEdgeX = podRect.left - containerRect.left
    rightEdgeX = podRect.right - containerRect.left
  }

  return {
    semiRowYs: semiRowYs.length > 0 ? semiRowYs : fallback.semiRowYs,
    finalRowY: finalEl ? relativeCenterY(finalEl) : fallback.finalRowY,
    thirdPlaceRowY: thirdEl ? relativeCenterY(thirdEl) : fallback.thirdPlaceRowY,
    leftEdgeX,
    rightEdgeX,
  }
}
