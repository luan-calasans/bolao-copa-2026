import type { MatchEventInfo, SportsdbEvent } from '../models/sportsdb.types'

function parseSpectators(value: string | null | undefined): number | null {
  if (!value?.trim()) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeVideoUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('www.youtube.com') || trimmed.startsWith('youtube.com')) {
    return `https://${trimmed}`
  }

  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`
  }

  return trimmed.includes('youtube.com') ? `https://${trimmed.replace(/^\/\//, '')}` : null
}

export function mapSportsdbEventInfo(event: SportsdbEvent | null | undefined): MatchEventInfo | null {
  if (!event) return null

  return {
    league: event.strLeague?.trim() || null,
    season: event.strSeason?.trim() || null,
    venue: event.strVenue?.trim() || null,
    city: event.strCity?.trim() || null,
    country: event.strCountry?.trim() || null,
    spectators: parseSpectators(event.intSpectators),
    referee: event.strOfficial?.trim() || null,
    videoUrl: normalizeVideoUrl(event.strVideo),
  }
}
