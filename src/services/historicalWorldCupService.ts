import type {
  HistoricalDataIndex,
  HistoricalGroupsJson,
  HistoricalStandingsJson,
  HistoricalTeamsJson,
  HistoricalTournamentData,
  HistoricalWorldCupJson,
  TournamentSummary,
} from '../models/historicalWorldCup'
import { extractTournamentSummary } from '../utils/historicalMatchUtils'
import { buildTeamWorldCupStats, summarizeTournaments } from '../utils/historicalTeamStats'

const dataBaseUrl = `${import.meta.env.BASE_URL}data`

const indexCache = { promise: null as Promise<HistoricalDataIndex> | null }
const tournamentCache = new Map<number, Promise<HistoricalTournamentData>>()
const aggregateCache = { promise: null as Promise<HistoricalAggregateData> | null }

export interface HistoricalAggregateData {
  years: number[]
  summaries: TournamentSummary[]
  teamStats: ReturnType<typeof buildTeamWorldCupStats>
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url} (${response.status}).`)
  }

  return (await response.json()) as T
}

export async function fetchHistoricalDataIndex(): Promise<HistoricalDataIndex> {
  if (!indexCache.promise) {
    indexCache.promise = fetchJson<HistoricalDataIndex>(`${dataBaseUrl}/index.json`).then((data) => {
      if (!data?.worldCups?.length) {
        throw new Error('Índice histórico da Copa indisponível.')
      }

      return data
    })
  }

  return indexCache.promise
}

export function getHistoricalWorldCupYears(index: HistoricalDataIndex): number[] {
  return index.worldCups.map((entry) => entry.year).sort((left, right) => right - left)
}

async function loadOptionalFile<T>(year: number, fileName: string): Promise<T | null> {
  return fetchJson<T>(`${dataBaseUrl}/${year}/${fileName}`)
}

export async function fetchHistoricalTournament(year: number): Promise<HistoricalTournamentData> {
  const cached = tournamentCache.get(year)

  if (cached) {
    return cached
  }

  const promise = (async () => {
    const index = await fetchHistoricalDataIndex()
    const entry = index.worldCups.find((item) => item.year === year)

    if (!entry) {
      throw new Error(`Copa de ${year} não encontrada no acervo histórico.`)
    }

    const worldCup = await loadOptionalFile<HistoricalWorldCupJson>(year, 'worldcup.json')

    if (!worldCup?.matches?.length) {
      throw new Error(`Jogos da Copa de ${year} indisponíveis.`)
    }

    const [groups, standings, teams] = await Promise.all([
      entry.files.includes('worldcup.groups.json')
        ? loadOptionalFile<HistoricalGroupsJson>(year, 'worldcup.groups.json')
        : Promise.resolve(null),
      entry.files.includes('worldcup.standings.json')
        ? loadOptionalFile<HistoricalStandingsJson>(year, 'worldcup.standings.json')
        : Promise.resolve(null),
      entry.files.includes('worldcup.teams.json')
        ? loadOptionalFile<HistoricalTeamsJson>(year, 'worldcup.teams.json')
        : Promise.resolve(null),
    ])

    return {
      year,
      name: worldCup.name,
      matches: worldCup.matches,
      groups,
      standings,
      teams,
      summary: extractTournamentSummary(year, worldCup.matches),
    }
  })()

  tournamentCache.set(year, promise)
  return promise
}

export async function fetchHistoricalAggregateData(): Promise<HistoricalAggregateData> {
  if (!aggregateCache.promise) {
    aggregateCache.promise = (async () => {
      const index = await fetchHistoricalDataIndex()
      const years = getHistoricalWorldCupYears(index)
      const tournaments = await Promise.all(years.map((year) => fetchHistoricalTournament(year)))

      return {
        years,
        summaries: summarizeTournaments(
          years,
          new Map(tournaments.map((tournament) => [tournament.year, tournament.matches])),
        ),
        teamStats: buildTeamWorldCupStats(
          tournaments.map((tournament) => ({
            year: tournament.year,
            matches: tournament.matches,
            summary: tournament.summary,
          })),
        ),
      }
    })()
  }

  return aggregateCache.promise
}

export function isValidHistoricalYear(value: string): number | null {
  const year = Number.parseInt(value, 10)
  if (!Number.isInteger(year) || year < 1930 || year > 2100) return null
  return year
}
