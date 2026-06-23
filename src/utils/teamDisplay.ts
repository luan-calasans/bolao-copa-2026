import type { Team } from '../models/team'
import { translateTeamName } from './teamNamesPt'

export function hasValidCrest(crest: string | null | undefined): boolean {
  return Boolean(crest?.trim())
}

export function isTeamDefined(team: Pick<Team, 'isDefined' | 'id' | 'name' | 'crest'>): boolean {
  if (typeof team.isDefined === 'boolean') {
    return team.isDefined
  }

  return team.id != null && Boolean(team.name?.trim()) && team.name !== 'Time'
}

export function areMatchTeamsDefined(match: {
  homeTeam: Pick<Team, 'isDefined' | 'id' | 'name' | 'crest'>
  awayTeam: Pick<Team, 'isDefined' | 'id' | 'name' | 'crest'>
}): boolean {
  return isTeamDefined(match.homeTeam) && isTeamDefined(match.awayTeam)
}

export function hasValidVenue(venue: string | null | undefined): boolean {
  return Boolean(venue?.trim())
}

export function getTeamInitials(
  tla?: string | null,
  shortName?: string | null,
  name?: string | null,
): string {
  if (tla?.trim()) return tla.trim().slice(0, 3).toUpperCase()
  if (shortName?.trim()) return shortName.trim().slice(0, 2).toUpperCase()
  if (name?.trim()) return name.trim().slice(0, 2).toUpperCase()
  return '?'
}

export function getTeamDisplayName(shortName?: string | null, name?: string | null): string {
  const raw = shortName?.trim() || name?.trim() || ''
  return translateTeamName(raw)
}
