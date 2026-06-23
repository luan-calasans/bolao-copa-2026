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
  const code = group.replace(/^GROUP_/i, '').toUpperCase()
  return GROUP_CODES.includes(code as GroupCode) ? (code as GroupCode) : null
}

export type BracketSlot =
  | { kind: 'groupPos'; group: GroupCode; position: 1 | 2 | 3 }
  | { kind: 'third'; eligible: GroupCode[] }

export interface R32TemplateMatch {
  key: string
  home: BracketSlot
  away: BracketSlot
}

/** Chaveamento oficial dos 16 avos (Round of 32) da Copa 2026. */
export const R32_TEMPLATE: R32TemplateMatch[] = [
  {
    key: 'r32-01',
    home: { kind: 'groupPos', group: 'A', position: 2 },
    away: { kind: 'groupPos', group: 'B', position: 2 },
  },
  {
    key: 'r32-02',
    home: { kind: 'groupPos', group: 'C', position: 1 },
    away: { kind: 'groupPos', group: 'F', position: 2 },
  },
  {
    key: 'r32-03',
    home: { kind: 'groupPos', group: 'E', position: 1 },
    away: { kind: 'third', eligible: ['A', 'B', 'C', 'D', 'F'] },
  },
  {
    key: 'r32-04',
    home: { kind: 'groupPos', group: 'F', position: 1 },
    away: { kind: 'groupPos', group: 'C', position: 2 },
  },
  {
    key: 'r32-05',
    home: { kind: 'groupPos', group: 'E', position: 2 },
    away: { kind: 'groupPos', group: 'I', position: 2 },
  },
  {
    key: 'r32-06',
    home: { kind: 'groupPos', group: 'I', position: 1 },
    away: { kind: 'third', eligible: ['C', 'D', 'F', 'G', 'H'] },
  },
  {
    key: 'r32-07',
    home: { kind: 'groupPos', group: 'A', position: 1 },
    away: { kind: 'third', eligible: ['C', 'E', 'F', 'H', 'I'] },
  },
  {
    key: 'r32-08',
    home: { kind: 'groupPos', group: 'L', position: 1 },
    away: { kind: 'third', eligible: ['E', 'H', 'I', 'J', 'K'] },
  },
  {
    key: 'r32-09',
    home: { kind: 'groupPos', group: 'G', position: 1 },
    away: { kind: 'third', eligible: ['A', 'E', 'H', 'I', 'J'] },
  },
  {
    key: 'r32-10',
    home: { kind: 'groupPos', group: 'D', position: 1 },
    away: { kind: 'third', eligible: ['B', 'E', 'F', 'I', 'J'] },
  },
  {
    key: 'r32-11',
    home: { kind: 'groupPos', group: 'H', position: 1 },
    away: { kind: 'groupPos', group: 'J', position: 2 },
  },
  {
    key: 'r32-12',
    home: { kind: 'groupPos', group: 'K', position: 2 },
    away: { kind: 'groupPos', group: 'L', position: 2 },
  },
  {
    key: 'r32-13',
    home: { kind: 'groupPos', group: 'B', position: 1 },
    away: { kind: 'third', eligible: ['E', 'F', 'G', 'I', 'J'] },
  },
  {
    key: 'r32-14',
    home: { kind: 'groupPos', group: 'D', position: 2 },
    away: { kind: 'groupPos', group: 'G', position: 2 },
  },
  {
    key: 'r32-15',
    home: { kind: 'groupPos', group: 'J', position: 1 },
    away: { kind: 'groupPos', group: 'H', position: 2 },
  },
  {
    key: 'r32-16',
    home: { kind: 'groupPos', group: 'K', position: 1 },
    away: { kind: 'third', eligible: ['D', 'E', 'I', 'J', 'L'] },
  },
]

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
