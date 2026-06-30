import type { ThirdPlaceWinnerSlot } from '../data/thirdPlacedMapping'

export type GroupCode =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'

export const GROUP_CODES: GroupCode[] = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
]

export function toGroupKey(code: GroupCode): string {
  return `GROUP_${code}`
}

export function groupCodeFromKey(group: string | null | undefined): GroupCode | null {
  if (!group) return null

  const normalized = group
    .trim()
    .replace(/^group[\s_-]*/i, '')
    .toUpperCase()

  return GROUP_CODES.includes(normalized as GroupCode) ? (normalized as GroupCode) : null
}

export function isSameGroup(
  groupA: string | null | undefined,
  groupB: string | null | undefined,
): boolean {
  const codeA = groupCodeFromKey(groupA)
  const codeB = groupCodeFromKey(groupB)
  return codeA != null && codeA === codeB
}

type BracketSlot =
  | { kind: 'groupPos'; group: GroupCode; position: 1 | 2 | 3 }
  | { kind: 'third'; eligible: GroupCode[] }

type R32MatchId =
  | 'M73'
  | 'M74'
  | 'M75'
  | 'M76'
  | 'M77'
  | 'M78'
  | 'M79'
  | 'M80'
  | 'M81'
  | 'M82'
  | 'M83'
  | 'M84'
  | 'M85'
  | 'M86'
  | 'M87'
  | 'M88'

interface R32MatchDefinition {
  matchId: R32MatchId
  home: BracketSlot
  away: BracketSlot
}

/** Confrontos fixos por número FIFA (M73–M88). */
const R32_MATCH_DEFINITIONS: Record<R32MatchId, R32MatchDefinition> = {
  M73: {
    matchId: 'M73',
    home: { kind: 'groupPos', group: 'A', position: 2 },
    away: { kind: 'groupPos', group: 'B', position: 2 },
  },
  M74: {
    matchId: 'M74',
    home: { kind: 'groupPos', group: 'E', position: 1 },
    away: { kind: 'third', eligible: ['A', 'B', 'C', 'D', 'F'] },
  },
  M75: {
    matchId: 'M75',
    home: { kind: 'groupPos', group: 'F', position: 1 },
    away: { kind: 'groupPos', group: 'C', position: 2 },
  },
  M76: {
    matchId: 'M76',
    home: { kind: 'groupPos', group: 'C', position: 1 },
    away: { kind: 'groupPos', group: 'F', position: 2 },
  },
  M77: {
    matchId: 'M77',
    home: { kind: 'groupPos', group: 'I', position: 1 },
    away: { kind: 'third', eligible: ['C', 'D', 'F', 'G', 'H'] },
  },
  M78: {
    matchId: 'M78',
    home: { kind: 'groupPos', group: 'E', position: 2 },
    away: { kind: 'groupPos', group: 'I', position: 2 },
  },
  M79: {
    matchId: 'M79',
    home: { kind: 'groupPos', group: 'A', position: 1 },
    away: { kind: 'third', eligible: ['C', 'E', 'F', 'H', 'I'] },
  },
  M80: {
    matchId: 'M80',
    home: { kind: 'groupPos', group: 'L', position: 1 },
    away: { kind: 'third', eligible: ['E', 'H', 'I', 'J', 'K'] },
  },
  M81: {
    matchId: 'M81',
    home: { kind: 'groupPos', group: 'D', position: 1 },
    away: { kind: 'third', eligible: ['B', 'E', 'F', 'I', 'J'] },
  },
  M82: {
    matchId: 'M82',
    home: { kind: 'groupPos', group: 'G', position: 1 },
    away: { kind: 'third', eligible: ['A', 'E', 'H', 'I', 'J'] },
  },
  M83: {
    matchId: 'M83',
    home: { kind: 'groupPos', group: 'K', position: 2 },
    away: { kind: 'groupPos', group: 'L', position: 2 },
  },
  M84: {
    matchId: 'M84',
    home: { kind: 'groupPos', group: 'H', position: 1 },
    away: { kind: 'groupPos', group: 'J', position: 2 },
  },
  M85: {
    matchId: 'M85',
    home: { kind: 'groupPos', group: 'B', position: 1 },
    away: { kind: 'third', eligible: ['E', 'F', 'G', 'I', 'J'] },
  },
  M86: {
    matchId: 'M86',
    home: { kind: 'groupPos', group: 'J', position: 1 },
    away: { kind: 'groupPos', group: 'H', position: 2 },
  },
  M87: {
    matchId: 'M87',
    home: { kind: 'groupPos', group: 'K', position: 1 },
    away: { kind: 'third', eligible: ['D', 'E', 'I', 'J', 'L'] },
  },
  M88: {
    matchId: 'M88',
    home: { kind: 'groupPos', group: 'D', position: 2 },
    away: { kind: 'groupPos', group: 'G', position: 2 },
  },
}

/**
 * Ordem visual do bracket (esquerda topo→baixo, direita topo→baixo).
 * A metade direita usa índices 8–15 revertidos em `getSideMatches`.
 */
export const BRACKET_R32_DISPLAY_ORDER: R32MatchId[] = [
  'M74',
  'M77',
  'M73',
  'M75',
  'M83',
  'M84',
  'M81',
  'M82',
  'M87',
  'M85',
  'M88',
  'M86',
  'M80',
  'M79',
  'M78',
  'M76',
]

function toR32Key(index: number): string {
  return `r32-${String(index + 1).padStart(2, '0')}`
}

function bracketSlotToCode(slot: BracketSlot): string {
  if (slot.kind === 'groupPos') {
    return `${slot.position}${slot.group}`
  }
  return '3RD'
}

const THIRD_PLACE_WINNER_SLOTS = new Set<ThirdPlaceWinnerSlot>([
  '1A',
  '1B',
  '1D',
  '1E',
  '1G',
  '1I',
  '1K',
  '1L',
])

function thirdPlaceWinnerSlot(home: BracketSlot, away: BracketSlot): ThirdPlaceWinnerSlot | undefined {
  if (away.kind !== 'third' || home.kind !== 'groupPos' || home.position !== 1) {
    return undefined
  }

  const slot = `1${home.group}` as ThirdPlaceWinnerSlot
  return THIRD_PLACE_WINNER_SLOTS.has(slot) ? slot : undefined
}

export interface RoundOf32FixtureTemplate {
  matchId: R32MatchId
  key: string
  homeCode: string
  awayCode: string
  homeWinnerSlot?: ThirdPlaceWinnerSlot
  thirdEligible?: GroupCode[]
}

export function buildRoundOf32Fixtures(): RoundOf32FixtureTemplate[] {
  return BRACKET_R32_DISPLAY_ORDER.map((matchId, index) => {
    const def = R32_MATCH_DEFINITIONS[matchId]
    const homeWinnerSlot = thirdPlaceWinnerSlot(def.home, def.away)
    const thirdEligible = def.away.kind === 'third' ? def.away.eligible : undefined

    return {
      matchId,
      key: toR32Key(index),
      homeCode: bracketSlotToCode(def.home),
      awayCode: bracketSlotToCode(def.away),
      homeWinnerSlot,
      thirdEligible,
    }
  })
}

export const KNOCKOUT_STAGE_ORDER = [
  'LAST_32',
  'LAST_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
] as const

export const KNOCKOUT_ROUND_LABELS: Record<string, string> = {
  LAST_32: '16 avos de final',
  LAST_16: 'Oitavas de final',
  QUARTER_FINALS: 'Quartas de final',
  SEMI_FINALS: 'Semifinais',
  THIRD_PLACE: 'Disputa do 3º lugar',
  FINAL: 'Final',
}

export const KNOCKOUT_ROUND_MATCH_COUNTS: Record<string, number> = {
  LAST_32: 16,
  LAST_16: 8,
  QUARTER_FINALS: 4,
  SEMI_FINALS: 2,
  THIRD_PLACE: 1,
  FINAL: 1,
}
