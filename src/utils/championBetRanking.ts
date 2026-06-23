import type { ApiTeamDetail } from '../models/api.types'
import type { BetsTableItem } from '../models/betsTable'
import type { ChampionBetEntry, ChampionBetMeta } from '../models/championBet'
import type { Match } from '../models/match'
import type { BetResultStatus } from './betResult'
import type { BetsMatchGroup } from './matchBetRows'
import { toApiRawStatus } from './matchStatus'
import { normalizePersonNameKey } from './participantKey'
import { getTeamDisplayName } from './teamDisplay'

function buildChampionFinalMatchPreview(
  finalMatch: NonNullable<ChampionBetMeta['finalMatch']>,
): Match {
  return {
    id: finalMatch.id,
    utcDate: finalMatch.utcDate,
    status: finalMatch.status as Match['status'],
    rawStatus: toApiRawStatus(finalMatch.status),
    minute: null,
    venue: null,
    matchday: null,
    stage: 'FINAL',
    group: null,
    homeTeam: {
      id: finalMatch.homeTeam.id,
      name: finalMatch.homeTeam.name ?? '',
      shortName: finalMatch.homeTeam.shortName ?? finalMatch.homeTeam.name ?? '',
      tla: finalMatch.homeTeam.tla ?? '',
      crest: finalMatch.homeTeam.crest ?? '',
      isDefined: finalMatch.homeTeam.id != null,
    },
    awayTeam: {
      id: finalMatch.awayTeam.id,
      name: finalMatch.awayTeam.name ?? '',
      shortName: finalMatch.awayTeam.shortName ?? finalMatch.awayTeam.name ?? '',
      tla: finalMatch.awayTeam.tla ?? '',
      crest: finalMatch.awayTeam.crest ?? '',
      isDefined: finalMatch.awayTeam.id != null,
    },
    score: { home: null, away: null },
    halfTimeScore: { home: null, away: null },
    isLive: false,
    lastUpdated: null,
  }
}

export function buildChampionBetTableItem(
  bet: ChampionBetEntry,
  finalMatch: ChampionBetMeta['finalMatch'],
): BetsTableItem {
  const resultStatus = (bet.scoreType ?? 'pending') as BetResultStatus
  const points = resultStatus === 'pending' ? null : (bet.points ?? 0)

  return {
    matchId: finalMatch?.id,
    match: finalMatch ? buildChampionFinalMatchPreview(finalMatch) : null,
    championTeam: bet.team,
    row: {
      entry: {
        receiptId: bet.receiptId,
        matchId: finalMatch?.id ?? 0,
        personName: bet.personName,
        createdAt: bet.createdAt,
        generatedAt: bet.generatedAt,
        updatedAt: bet.updatedAt,
      },
      displayName: bet.personName?.trim() || 'Sem nome',
      resultStatus,
      points,
    },
  }
}

export function formatChampionBetStatLabel(team: ApiTeamDetail): string {
  const teamName = getTeamDisplayName(team.shortName, team.name)
  return `Campeão da Copa — ${teamName}`
}

export function formatChampionBetPickLabel(team: ApiTeamDetail): string {
  const teamName = getTeamDisplayName(team.shortName, team.name)
  return `${teamName} campeão`
}

export function findChampionBetForPerson(
  bets: ChampionBetEntry[],
  personNameKey: string,
): ChampionBetEntry | null {
  return (
    bets.find((bet) => normalizePersonNameKey(bet.personName) === personNameKey) ?? null
  )
}

export function buildChampionBetMatchGroup(item: BetsTableItem): BetsMatchGroup {
  const { resultStatus } = item.row

  return {
    matchId: item.matchId ?? 0,
    match: item.match ?? null,
    rows: [item.row],
    championTeam: item.championTeam,
    exactCount: resultStatus === 'exact' ? 1 : 0,
    partialCount: resultStatus === 'partial' ? 1 : 0,
  }
}

export function buildChampionBetMatchGroups(
  bets: ChampionBetEntry[],
  finalMatch: ChampionBetMeta['finalMatch'],
): BetsMatchGroup[] {
  return bets.map((bet) =>
    buildChampionBetMatchGroup(buildChampionBetTableItem(bet, finalMatch)),
  )
}
