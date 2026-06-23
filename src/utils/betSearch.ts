import type { Match } from '../models/match'
import type { ApiTeamDetail } from '../models/api.types'
import { formatChampionBetPickLabel } from './championBetRanking'
import { getTeamDisplayName } from './teamDisplay'

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function matchesBetSearchQuery(
  query: string,
  item: {
    displayName: string
    match?: Match | null
    matchId?: number
    championTeam?: ApiTeamDetail
  },
): boolean {
  const normalized = normalizeSearchText(query)
  if (!normalized) return true

  const haystacks: string[] = [item.displayName]

  if (item.championTeam) {
    const teamName = getTeamDisplayName(item.championTeam.shortName, item.championTeam.name)
    const pickLabel = formatChampionBetPickLabel(item.championTeam)
    haystacks.push(
      teamName,
      pickLabel,
      item.championTeam.name ?? '',
      item.championTeam.shortName ?? '',
      item.championTeam.tla ?? '',
      'campeao da copa',
      `campeao da copa — ${teamName}`,
    )
  }

  if (item.match) {
    const home = getTeamDisplayName(item.match.homeTeam.shortName, item.match.homeTeam.name)
    const away = getTeamDisplayName(item.match.awayTeam.shortName, item.match.awayTeam.name)

    haystacks.push(
      home,
      away,
      `${home} x ${away}`,
      `${home} vs ${away}`,
      item.match.homeTeam.name,
      item.match.awayTeam.name,
      item.match.homeTeam.shortName ?? '',
      item.match.awayTeam.shortName ?? '',
      item.match.homeTeam.tla ?? '',
      item.match.awayTeam.tla ?? '',
    )
  } else if (item.matchId != null) {
    haystacks.push(`jogo #${item.matchId}`, String(item.matchId))
  }

  return haystacks.some((text) => normalizeSearchText(text).includes(normalized))
}
