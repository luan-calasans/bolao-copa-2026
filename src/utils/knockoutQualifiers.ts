import type { ApiStandingRow, ApiStandingTable } from '../models/api.types'
import { GROUP_CODES, groupCodeFromKey, toGroupKey, type GroupCode } from './knockoutBracketTemplate'

export interface GroupStandingSnapshot {
  group: GroupCode
  first: ApiStandingRow | null
  second: ApiStandingRow | null
  third: ApiStandingRow | null
}

export function buildGroupSnapshots(standings: ApiStandingTable[]): GroupStandingSnapshot[] {
  const snapshots: GroupStandingSnapshot[] = []

  for (const code of GROUP_CODES) {
    const groupKey = toGroupKey(code)
    const table = standings.find((standing) => standing.group === groupKey)?.table ?? []

    snapshots.push({
      group: code,
      first: table.find((row) => row.position === 1) ?? null,
      second: table.find((row) => row.position === 2) ?? null,
      third: table.find((row) => row.position === 3) ?? null,
    })
  }

  return snapshots
}

function compareThirdPlaceRows(a: ApiStandingRow, b: ApiStandingRow): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return (a.team.name ?? '').localeCompare(b.team.name ?? '', 'pt-BR')
}

export function rankThirdPlaceTeams(snapshots: GroupStandingSnapshot[]): ApiStandingRow[] {
  const thirds = snapshots
    .map((snapshot) => snapshot.third)
    .filter((row): row is ApiStandingRow => row != null)

  return [...thirds].sort(compareThirdPlaceRows)
}

export function getQualifiedThirdGroups(snapshots: GroupStandingSnapshot[]): Set<GroupCode> {
  const ranked = rankThirdPlaceTeams(snapshots)
  const qualified = new Set<GroupCode>()

  for (const row of ranked.slice(0, 8)) {
    const group = snapshots.find((snapshot) => snapshot.third?.team.id === row.team.id)?.group
    if (group) {
      qualified.add(group)
    }
  }

  return qualified
}

export function isGroupStageComplete(standings: ApiStandingTable[]): boolean {
  if (standings.length === 0) return false

  return standings.every((standing) => {
    const group = groupCodeFromKey(standing.group)
    if (!group) return false

    return standing.table.every((row) => row.playedGames >= 3)
  })
}

export function getStandingRowByGroupPosition(
  snapshots: GroupStandingSnapshot[],
  group: GroupCode,
  position: 1 | 2 | 3,
): ApiStandingRow | null {
  const snapshot = snapshots.find((entry) => entry.group === group)
  if (!snapshot) return null

  if (position === 1) return snapshot.first
  if (position === 2) return snapshot.second
  return snapshot.third
}

export function formatGroupPositionLabel(group: GroupCode, position: 1 | 2 | 3): string {
  const ordinals = { 1: '1º', 2: '2º', 3: '3º' } as const
  return `${ordinals[position]} Grupo ${group}`
}

export function formatThirdSlotLabel(eligible: GroupCode[]): string {
  if (eligible.length === 0) return '3º colocado'
  return `3º (${eligible.join('/')})`
}
