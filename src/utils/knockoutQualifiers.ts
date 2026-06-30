import type { ApiStandingRow, ApiStandingTable } from '../models/api.types'
import {
  GROUP_CODES,
  groupCodeFromKey,
  type GroupCode,
} from './knockoutBracketTemplate'
import { compareStandingRows } from './standingsTiebreaker'

export interface GroupStandingSnapshot {
  group: GroupCode
  first: ApiStandingRow | null
  second: ApiStandingRow | null
  third: ApiStandingRow | null
}

function findGroupStandingTable(
  standings: ApiStandingTable[],
  code: GroupCode,
): ApiStandingRow[] {
  return standings.find((standing) => groupCodeFromKey(standing.group) === code)?.table ?? []
}

export function buildGroupSnapshots(standings: ApiStandingTable[]): GroupStandingSnapshot[] {
  const snapshots: GroupStandingSnapshot[] = []

  for (const code of GROUP_CODES) {
    const table = findGroupStandingTable(standings, code)

    snapshots.push({
      group: code,
      first: table.find((row) => row.position === 1) ?? null,
      second: table.find((row) => row.position === 2) ?? null,
      third: table.find((row) => row.position === 3) ?? null,
    })
  }

  return snapshots
}

export function rankThirdPlaceTeams(snapshots: GroupStandingSnapshot[]): ApiStandingRow[] {
  const thirds = snapshots
    .map((snapshot) => snapshot.third)
    .filter((row): row is ApiStandingRow => row != null)

  return [...thirds].sort(compareStandingRows)
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
  if (standings.length < GROUP_CODES.length) return false

  const groupStandings = standings.filter((standing) => groupCodeFromKey(standing.group) != null)
  if (groupStandings.length < GROUP_CODES.length) return false

  return groupStandings.every((standing) =>
    standing.table.every((row) => row.playedGames >= 3),
  )
}
