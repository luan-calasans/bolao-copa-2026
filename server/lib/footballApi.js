import { getFootballToken } from './footballToken.js'
import {
  resolveExtraTimeScoreFromApi,
  resolvePenaltyScoreFromApi,
  resolveRegulationScoreFromApi,
} from '../../shared/footballApiScore.js'
import { normalizeMatchWinner } from '../../shared/matchResult.js'
import { normalizeMatchStatus } from '../../shared/matchStatus.js'

function mapApiMatch(apiMatch) {
  const rawStatus = apiMatch.status
  const score = resolveRegulationScoreFromApi(apiMatch.score)

  return {
    id: apiMatch.id,
    status: normalizeMatchStatus(rawStatus),
    score,
    penalties: resolvePenaltyScoreFromApi(apiMatch.score),
    extraTime: resolveExtraTimeScoreFromApi(apiMatch.score),
    winner: normalizeMatchWinner(apiMatch.score?.winner ?? null),
  }
}

function mapApiMatchForChampion(apiMatch) {
  const mapped = mapApiMatch(apiMatch)

  return {
    ...mapped,
    stage: apiMatch.stage ?? null,
    utcDate: apiMatch.utcDate ?? null,
    homeTeam: {
      id: apiMatch.homeTeam?.id ?? null,
      name: apiMatch.homeTeam?.name?.trim() ?? '',
      shortName: apiMatch.homeTeam?.shortName?.trim() ?? apiMatch.homeTeam?.name?.trim() ?? '',
      crest: apiMatch.homeTeam?.crest ?? null,
    },
    awayTeam: {
      id: apiMatch.awayTeam?.id ?? null,
      name: apiMatch.awayTeam?.name?.trim() ?? '',
      shortName: apiMatch.awayTeam?.shortName?.trim() ?? apiMatch.awayTeam?.name?.trim() ?? '',
      crest: apiMatch.awayTeam?.crest ?? null,
    },
    score: {
      ...mapped.score,
      winner: apiMatch.score?.winner ?? null,
    },
  }
}

export async function fetchWorldCupMatches() {
  const token = getFootballToken()

  if (!token) {
    throw new Error(
      'FOOTBALL_API_TOKEN não configurado. Adicione em .env ou nas variáveis da Vercel.',
    )
  }

  const response = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
    {
      headers: {
        'X-Auth-Token': token,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Erro ao buscar jogos da Copa (${response.status}).`)
  }

  const body = await response.json()
  return (body.matches ?? []).map(mapApiMatch)
}

export async function fetchWorldCupMatchesForChampion() {
  const token = getFootballToken()

  if (!token) {
    throw new Error(
      'FOOTBALL_API_TOKEN não configurado. Adicione em .env ou nas variáveis da Vercel.',
    )
  }

  const response = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
    {
      headers: {
        'X-Auth-Token': token,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Erro ao buscar jogos da Copa (${response.status}).`)
  }

  const body = await response.json()
  return (body.matches ?? []).map(mapApiMatchForChampion)
}

export async function fetchWorldCupTeams() {
  const token = getFootballToken()

  if (!token) {
    throw new Error(
      'FOOTBALL_API_TOKEN não configurado. Adicione em .env ou nas variáveis da Vercel.',
    )
  }

  const response = await fetch(
    'https://api.football-data.org/v4/competitions/WC/teams?season=2026',
    {
      headers: {
        'X-Auth-Token': token,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Erro ao buscar seleções da Copa (${response.status}).`)
  }

  const body = await response.json()
  return body.teams ?? []
}

export function mapMatchesById(matches) {
  return new Map(matches.map((match) => [match.id, match]))
}

let fetchMatchByIdOverride = null

export function setFetchMatchByIdOverride(override) {
  fetchMatchByIdOverride = override
}

export function resetFetchMatchByIdOverride() {
  fetchMatchByIdOverride = null
}

export async function fetchMatchById(matchId) {
  if (fetchMatchByIdOverride) {
    return fetchMatchByIdOverride(matchId)
  }

  const token = getFootballToken()

  if (!token) {
    throw new Error(
      'FOOTBALL_API_TOKEN não configurado. Adicione em .env ou nas variáveis da Vercel.',
    )
  }

  const response = await fetch(`https://api.football-data.org/v4/matches/${matchId}`, {
    headers: {
      'X-Auth-Token': token,
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Erro ao buscar jogo (${response.status}).`)
  }

  return response.json()
}
