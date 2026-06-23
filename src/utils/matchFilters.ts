import type { Match, MatchGroups } from '../models/match'
import type { Team } from '../models/team'
import { getTeamDisplayName } from './teamDisplay'

export type MatchFilter = 'all' | 'live' | 'upcoming' | 'finished' | 'undefined'

export interface MatchFilterOption {
  id: MatchFilter
  label: string
  count: number
}

export interface CountryFilterOption {
  id: number
  label: string
}

function flattenGroups(groups: MatchGroups): Match[] {
  return [...groups.live, ...groups.upcoming, ...groups.finished, ...groups.undefined]
}

function teamKey(team: Team): number | null {
  return team.id
}

export function getCountryFilterOptions(groups: MatchGroups): CountryFilterOption[] {
  const teams = new Map<number, string>()

  for (const match of flattenGroups(groups)) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      const id = teamKey(team)
      if (id == null) continue

      const label = getTeamDisplayName(team.shortName, team.name)
      if (label) {
        teams.set(id, label)
      }
    }
  }

  return [...teams.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function filterGroupsByCountry(groups: MatchGroups, countryId: number | null): MatchGroups {
  if (countryId == null) return groups

  const matchesCountry = (match: Match) =>
    match.homeTeam.id === countryId || match.awayTeam.id === countryId

  return {
    live: groups.live.filter(matchesCountry),
    upcoming: groups.upcoming.filter(matchesCountry),
    finished: groups.finished.filter(matchesCountry),
    undefined: groups.undefined.filter(matchesCountry),
  }
}

export function getFilterOptions(groups: MatchGroups): MatchFilterOption[] {
  const liveCount = groups.live.length
  const upcomingCount = groups.upcoming.length
  const finishedCount = groups.finished.length
  const undefinedCount = groups.undefined.length
  const total = liveCount + upcomingCount + finishedCount + undefinedCount

  const options: MatchFilterOption[] = []

  if (total > 0) {
    options.push({ id: 'all', label: 'Todos', count: total })
  }

  if (liveCount > 0) {
    options.push({ id: 'live', label: 'Ao vivo', count: liveCount })
  }

  if (upcomingCount > 0) {
    options.push({ id: 'upcoming', label: 'Futuros', count: upcomingCount })
  }

  if (finishedCount > 0) {
    options.push({ id: 'finished', label: 'Encerrados', count: finishedCount })
  }

  if (undefinedCount > 0) {
    options.push({ id: 'undefined', label: 'Não definidos', count: undefinedCount })
  }

  return options
}

export function getFilteredGroups(groups: MatchGroups, filter: MatchFilter): MatchGroups {
  const finished = [...groups.finished].reverse()

  switch (filter) {
    case 'live':
      return { live: groups.live, upcoming: [], finished: [], undefined: [] }
    case 'upcoming':
      return { live: [], upcoming: groups.upcoming, finished: [], undefined: [] }
    case 'finished':
      return { live: [], upcoming: [], finished, undefined: [] }
    case 'undefined':
      return { live: [], upcoming: [], finished: [], undefined: groups.undefined }
    default:
      return {
        live: groups.live,
        upcoming: groups.upcoming,
        finished: finished.slice(0, 9),
        undefined: groups.undefined,
      }
  }
}

export function hasVisibleMatches(groups: MatchGroups): boolean {
  return (
    groups.live.length +
    groups.upcoming.length +
    groups.finished.length +
    groups.undefined.length >
    0
  )
}

export function getFilterEmptyMessage(filter: MatchFilter): string {
  const messages: Record<MatchFilter, string> = {
    all: 'Não há jogos disponíveis no momento.',
    live: 'Nenhum jogo ao vivo no momento.',
    upcoming: 'Nenhum jogo futuro agendado no momento.',
    finished: 'Nenhum jogo encerrado no momento.',
    undefined: 'Nenhum jogo com times indefinidos no momento.',
  }

  return messages[filter]
}
