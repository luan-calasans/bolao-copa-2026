import type { Match } from '../models/match'
import type { MatchHighlightImages } from '../models/matchHighlight'
import { hasMatchHighlightImages } from '../models/matchHighlight'
import type {
  MatchDetails,
  SportsdbEvent,
  SportsdbEventsDayResponse,
  SportsdbEventStatsResponse,
  SportsdbHighlightsResponse,
  SportsdbLineupResponse,
  SportsdbLookupEventResponse,
  SportsdbSearchEventsResponse,
  SportsdbTimelineResponse,
} from '../models/sportsdb.types'
import { mapSportsdbEventInfo } from '../utils/matchEventInfoMapper'
import {
  mapSportsdbEventToHighlightImages,
  mergeMatchHighlightImages,
} from '../utils/matchHighlightMapper'
import { mapTimelineToGoals } from '../utils/matchGoalsMapper'
import { mapSportsdbLineups } from '../utils/matchLineupMapper'
import { mapEventStats } from '../utils/matchStatsMapper'
import { mapTimelineToEvents } from '../utils/matchTimelineMapper'
import { toSportsdbSearchToken, toSportsdbTeamName } from '../utils/sportsdbTeamNames'
import { sportsdbFetch } from './sportsdbApiClient'

export interface ResolvedSportsdbEvent {
  idEvent: string
}

function formatEventDate(utcDate: string): string {
  return utcDate.slice(0, 10)
}

function getEventSearchDates(utcDate: string): string[] {
  const primary = formatEventDate(utcDate)
  const previousDay = new Date(`${primary}T00:00:00Z`)
  previousDay.setUTCDate(previousDay.getUTCDate() - 1)
  const alternate = previousDay.toISOString().slice(0, 10)

  return primary === alternate ? [primary] : [primary, alternate]
}

function buildEventSearchQuery(homeTeamName: string, awayTeamName: string): string {
  return `${toSportsdbSearchToken(homeTeamName)}_vs_${toSportsdbSearchToken(awayTeamName)}`
}

function normalizeName(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function teamsMatchEvent(
  event: Pick<SportsdbEvent, 'strHomeTeam' | 'strAwayTeam'>,
  homeTeamName: string,
  awayTeamName: string,
): boolean {
  const expectedHome = normalizeName(toSportsdbTeamName(homeTeamName))
  const expectedAway = normalizeName(toSportsdbTeamName(awayTeamName))
  const eventHome = normalizeName(event.strHomeTeam)
  const eventAway = normalizeName(event.strAwayTeam)

  return (
    (eventHome === expectedHome && eventAway === expectedAway) ||
    (eventHome === expectedAway && eventAway === expectedHome)
  )
}

function toResolvedEvent(event: SportsdbEvent): ResolvedSportsdbEvent {
  return {
    idEvent: event.idEvent,
  }
}

async function searchEventByTeamsAndDate(
  homeTeamName: string,
  awayTeamName: string,
  date: string,
): Promise<ResolvedSportsdbEvent | null> {
  const searchQuery = buildEventSearchQuery(homeTeamName, awayTeamName)
  const response = await sportsdbFetch<SportsdbSearchEventsResponse>('searchevents.php', {
    e: searchQuery,
    d: date,
  })

  const match = response.event?.find((event) => teamsMatchEvent(event, homeTeamName, awayTeamName))
  return match ? toResolvedEvent(match) : null
}

async function searchEventOnDay(
  homeTeamName: string,
  awayTeamName: string,
  date: string,
): Promise<ResolvedSportsdbEvent | null> {
  const response = await sportsdbFetch<SportsdbEventsDayResponse>('eventsday.php', {
    d: date,
    s: 'Soccer',
  })

  const match = response.events?.find((event) => teamsMatchEvent(event, homeTeamName, awayTeamName))
  return match ? toResolvedEvent(match) : null
}

function eventTitleMatchesTeams(
  eventTitle: string | null | undefined,
  homeTeamName: string,
  awayTeamName: string,
): boolean {
  const normalizedTitle = normalizeName(eventTitle)
  if (!normalizedTitle) return false

  const homeTokens = [
    normalizeName(toSportsdbTeamName(homeTeamName)),
    normalizeName(homeTeamName),
  ].filter(Boolean)
  const awayTokens = [
    normalizeName(toSportsdbTeamName(awayTeamName)),
    normalizeName(awayTeamName),
  ].filter(Boolean)

  const hasHome = homeTokens.some((token) => normalizedTitle.includes(token))
  const hasAway = awayTokens.some((token) => normalizedTitle.includes(token))

  return hasHome && hasAway
}

function highlightEntryMatchesTeams(
  entry: {
    strEvent?: string | null
    strHomeTeam?: string | null
    strAwayTeam?: string | null
  },
  homeTeamName: string,
  awayTeamName: string,
): boolean {
  if (entry.strHomeTeam != null && entry.strAwayTeam != null) {
    return teamsMatchEvent(
      { strHomeTeam: entry.strHomeTeam, strAwayTeam: entry.strAwayTeam },
      homeTeamName,
      awayTeamName,
    )
  }

  return eventTitleMatchesTeams(entry.strEvent, homeTeamName, awayTeamName)
}

async function fetchHighlightsFromDay(
  homeTeamName: string,
  awayTeamName: string,
  date: string,
): Promise<MatchHighlightImages | null> {
  const response = await sportsdbFetch<SportsdbHighlightsResponse>('eventshighlights.php', {
    d: date,
    s: 'Soccer',
  })

  const match = response.tvhighlights?.find((entry) =>
    highlightEntryMatchesTeams(entry, homeTeamName, awayTeamName),
  )

  if (!match) return null

  const images = mapSportsdbEventToHighlightImages(match)
  return hasMatchHighlightImages(images) ? images : null
}

async function fetchHighlightsFromFilename(
  filename: string,
  homeTeamName: string,
  awayTeamName: string,
): Promise<MatchHighlightImages | null> {
  const response = await sportsdbFetch<SportsdbSearchEventsResponse>('searchfilename.php', {
    e: filename,
  })

  const match = response.event?.find((event) => teamsMatchEvent(event, homeTeamName, awayTeamName))
  if (!match) return null

  const images = mapSportsdbEventToHighlightImages(match)
  return hasMatchHighlightImages(images) ? images : null
}

export async function fetchMatchHighlightImages(match: Match): Promise<MatchHighlightImages | null> {
  const homeTeamName = match.homeTeam.name?.trim()
  const awayTeamName = match.awayTeam.name?.trim()

  if (!homeTeamName || !awayTeamName) {
    return null
  }

  const sources: MatchHighlightImages[] = []

  for (const date of getEventSearchDates(match.utcDate)) {
    const fromDay = await fetchHighlightsFromDay(homeTeamName, awayTeamName, date)
    if (fromDay) sources.push(fromDay)
  }

  const resolved = await resolveSportsdbEvent(match)
  if (resolved) {
    const lookupResponse = await sportsdbFetch<SportsdbLookupEventResponse>('lookupevent.php', {
      id: resolved.idEvent,
    })
    const event = lookupResponse.events?.[0] ?? null

    const fromLookup = mapSportsdbEventToHighlightImages(event)
    if (hasMatchHighlightImages(fromLookup)) {
      sources.push(fromLookup)
    }

    const filename = event?.strFilename?.trim()
    if (filename) {
      const fromFilename = await fetchHighlightsFromFilename(filename, homeTeamName, awayTeamName)
      if (fromFilename) sources.push(fromFilename)
    }
  }

  const merged = mergeMatchHighlightImages(...sources)
  return hasMatchHighlightImages(merged) ? merged : null
}

export async function resolveSportsdbEvent(match: Match): Promise<ResolvedSportsdbEvent | null> {
  const homeTeamName = match.homeTeam.name?.trim()
  const awayTeamName = match.awayTeam.name?.trim()

  if (!homeTeamName || !awayTeamName) {
    return null
  }

  for (const date of getEventSearchDates(match.utcDate)) {
    const event = await searchEventByTeamsAndDate(homeTeamName, awayTeamName, date)
    if (event) {
      return event
    }
  }

  for (const date of getEventSearchDates(match.utcDate)) {
    const event = await searchEventOnDay(homeTeamName, awayTeamName, date)
    if (event) {
      return event
    }
  }

  return null
}

async function fetchSportsdbTimeline(eventId: string) {
  const response = await sportsdbFetch<SportsdbTimelineResponse>('lookuptimeline.php', {
    id: eventId,
  })

  return response.timeline
}

export async function fetchMatchDetails(match: Match): Promise<MatchDetails | null> {
  const resolved = await resolveSportsdbEvent(match)

  if (!resolved) {
    return null
  }

  const [eventResponse, timelineEntries, statsResponse, lineupResponse] = await Promise.all([
    sportsdbFetch<SportsdbLookupEventResponse>('lookupevent.php', { id: resolved.idEvent }),
    fetchSportsdbTimeline(resolved.idEvent),
    sportsdbFetch<SportsdbEventStatsResponse>('lookupeventstats.php', { id: resolved.idEvent }),
    sportsdbFetch<SportsdbLineupResponse>('lookuplineup.php', { id: resolved.idEvent }),
  ])

  const event = eventResponse.events?.[0] ?? null
  const goals = mapTimelineToGoals(timelineEntries)

  return {
    eventInfo: mapSportsdbEventInfo(event),
    goals,
    timeline: mapTimelineToEvents(timelineEntries),
    stats: mapEventStats(statsResponse.eventstats),
    lineups: mapSportsdbLineups(lineupResponse.lineup),
  }
}
