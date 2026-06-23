import type { ApiStandingTable } from '../models/api.types'
import type { CountryFilterOption } from './matchFilters'
import { getTeamDisplayName } from './teamDisplay'

export function getStandingsCountryFilterOptions(
  standings: ApiStandingTable[],
): CountryFilterOption[] {
  const teams = new Map<number, string>()

  for (const standing of standings) {
    for (const row of standing.table) {
      const id = row.team.id
      if (id == null) continue

      const label = getTeamDisplayName(row.team.shortName, row.team.name)
      if (label) {
        teams.set(id, label)
      }
    }
  }

  return [...teams.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export function filterStandingsByCountry(
  standings: ApiStandingTable[],
  countryId: number | null,
): ApiStandingTable[] {
  if (countryId == null) return standings

  return standings.filter((standing) =>
    standing.table.some((row) => row.team.id === countryId),
  )
}
