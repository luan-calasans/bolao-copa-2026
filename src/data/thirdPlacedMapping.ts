import type { GroupCode } from '../utils/knockoutBracketTemplate'
import annexCRows from './annexCRows.json'

/**
 * Grupos cujos campeões enfrentam terceiros colocados nos 16 avos (Anexo C da FIFA).
 * Ordem das colunas na tabela oficial: 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L.
 */
export const ANNEX_C_WINNER_GROUPS = ['A', 'B', 'D', 'E', 'G', 'I', 'K', 'L'] as const

export type ThirdPlaceWinnerSlot = `1${(typeof ANNEX_C_WINNER_GROUPS)[number]}`
export type ThirdPlaceSourceCode = `3${GroupCode}`

export type ThirdPlaceSlotMapping = Record<ThirdPlaceWinnerSlot, ThirdPlaceSourceCode>

function buildThirdPlacedMapping(): Record<string, ThirdPlaceSlotMapping> {
  const mapping: Record<string, ThirdPlaceSlotMapping> = {}

  for (const row of annexCRows) {
    const combinationKey = [...row].sort().join('')
    const entry = {} as ThirdPlaceSlotMapping

    for (let index = 0; index < ANNEX_C_WINNER_GROUPS.length; index += 1) {
      const winnerGroup = ANNEX_C_WINNER_GROUPS[index]
      const thirdGroup = row[index] as GroupCode
      entry[`1${winnerGroup}`] = `3${thirdGroup}`
    }

    mapping[combinationKey] = entry
  }

  return mapping
}

/** Tabela oficial do Anexo C — 495 combinações de 8 terceiros classificados. */
export const thirdPlacedMapping = buildThirdPlacedMapping()

export function getThirdPlaceCombinationKey(groups: GroupCode[]): string {
  return [...groups].sort().join('')
}

export function lookupThirdPlaceMapping(
  qualifiedThirdGroups: GroupCode[],
): ThirdPlaceSlotMapping | null {
  if (qualifiedThirdGroups.length !== 8) return null

  const key = getThirdPlaceCombinationKey(qualifiedThirdGroups)
  return thirdPlacedMapping[key] ?? null
}
