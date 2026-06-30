import type { ApiStandingRow, ApiStandingTable } from '../models/api.types'
import type { Team } from '../models/team'
import { lookupThirdPlaceMapping } from '../data/thirdPlacedMapping'
import {
  buildGroupSnapshots,
  isGroupStageComplete,
  rankThirdPlaceTeams,
} from './knockoutQualifiers'
import { buildRoundOf32Fixtures, type GroupCode, type RoundOf32FixtureTemplate } from './knockoutBracketTemplate'

export type PositionCode = `${1 | 2 | 3}${GroupCode}`

export interface GroupPositionEntry {
  code: PositionCode
  group: GroupCode
  position: 1 | 2 | 3
  row: ApiStandingRow | null
  team: Team | null
}

export interface ThirdPlaceQualifier {
  rank: number
  group: GroupCode
  row: ApiStandingRow
  team: Team | null
  isQualified: boolean
}

export interface RoundOf32Match {
  matchId: string
  key: string
  round: 'round_of_32'
  homeCode: string
  awayCode: string
  homeTeam: Team | null
  awayTeam: Team | null
  homeLabel: string
  awayLabel: string
  isResolved: boolean
}

function mapStandingRowToTeam(row: ApiStandingRow | null): Team | null {
  if (!row) return null

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

function formatThirdPlaceholder(eligible: GroupCode[]): string {
  return `3º (${eligible.join('/')})`
}

function resolveParticipant(
  code: string,
  positions: Record<string, GroupPositionEntry>,
  groupStageComplete: boolean,
): { team: Team | null; label: string; resolved: boolean } {
  const entry = positions[code]

  if (!entry?.row || !groupStageComplete) {
    return { team: null, label: code, resolved: false }
  }

  const team = entry.team
  return {
    team,
    label: team ? team.shortName || team.name : code,
    resolved: team != null,
  }
}

export function getGroupPositions(standings: ApiStandingTable[]): Record<string, GroupPositionEntry> {
  const snapshots = buildGroupSnapshots(standings)
  const positions: Record<string, GroupPositionEntry> = {}

  for (const snapshot of snapshots) {
    const entries: Array<{ position: 1 | 2 | 3; row: ApiStandingRow | null }> = [
      { position: 1, row: snapshot.first },
      { position: 2, row: snapshot.second },
      { position: 3, row: snapshot.third },
    ]

    for (const { position, row } of entries) {
      const code = `${position}${snapshot.group}` as PositionCode
      positions[code] = {
        code,
        group: snapshot.group,
        position,
        row,
        team: mapStandingRowToTeam(row),
      }
    }
  }

  return positions
}

export function getBestThirdPlacedTeams(standings: ApiStandingTable[]): ThirdPlaceQualifier[] {
  const snapshots = buildGroupSnapshots(standings)
  const ranked = rankThirdPlaceTeams(snapshots)

  return ranked.map((row, index) => {
    const group =
      snapshots.find((snapshot) => snapshot.third?.team.id === row.team.id)?.group ?? 'A'

    return {
      rank: index + 1,
      group,
      row,
      team: mapStandingRowToTeam(row),
      isQualified: index < 8,
    }
  })
}

export function getThirdPlacedCombination(bestThirds: ThirdPlaceQualifier[]): GroupCode[] {
  return bestThirds.filter((entry) => entry.isQualified).map((entry) => entry.group)
}

export function generateRoundOf32(standings: ApiStandingTable[]): RoundOf32Match[] {
  const groupStageComplete = isGroupStageComplete(standings)
  const positions = getGroupPositions(standings)
  const bestThirds = getBestThirdPlacedTeams(standings)
  const qualifiedGroups = getThirdPlacedCombination(bestThirds)
  const thirdMapping =
    groupStageComplete && qualifiedGroups.length === 8
      ? lookupThirdPlaceMapping(qualifiedGroups)
      : null

  const fixtures: RoundOf32FixtureTemplate[] = buildRoundOf32Fixtures()

  return fixtures.map((fixture) => {
    const home = resolveParticipant(fixture.homeCode, positions, groupStageComplete)

    let awayCode = fixture.awayCode
    let away = resolveParticipant(fixture.awayCode, positions, groupStageComplete)

    if (fixture.homeWinnerSlot && fixture.thirdEligible) {
      if (thirdMapping) {
        awayCode = thirdMapping[fixture.homeWinnerSlot]
        away = resolveParticipant(awayCode, positions, groupStageComplete)
      } else if (groupStageComplete && qualifiedGroups.length === 8) {
        awayCode = '3RD'
        away = { team: null, label: 'A definir', resolved: false }
      } else {
        awayCode = '3RD'
        away = {
          team: null,
          label: formatThirdPlaceholder(fixture.thirdEligible),
          resolved: false,
        }
      }
    }

    const isResolved = home.resolved && away.resolved

    return {
      matchId: fixture.matchId,
      key: fixture.key,
      round: 'round_of_32',
      homeCode: fixture.homeCode,
      awayCode,
      homeTeam: home.team,
      awayTeam: away.team,
      homeLabel: home.label,
      awayLabel: away.label,
      isResolved,
    }
  })
}
