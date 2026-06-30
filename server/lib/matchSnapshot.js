import { isLiveStatus, normalizeMatchStatus } from '../../shared/matchStatus.js'
import { resolveRegulationScoreFromApi } from '../../shared/footballApiScore.js'

const CRESTS_HOST = 'crests.football-data.org'

function normalizeCrestUrl(crest) {
  const trimmed = crest?.trim() ?? ''
  if (!trimmed) return ''

  if (trimmed.startsWith('/api/crests/')) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    if (url.hostname === CRESTS_HOST) {
      return `/api/crests${url.pathname}`
    }
  } catch {
    return trimmed
  }

  return trimmed
}

function mapTeam(team) {
  const isDefined = team?.id != null && Boolean(team?.name?.trim())

  return {
    id: team?.id ?? null,
    name: team?.name?.trim() || '',
    shortName: team?.shortName?.trim() || team?.name?.trim() || '',
    tla: team?.tla?.trim() || '',
    crest: isDefined ? normalizeCrestUrl(team?.crest?.trim() ?? '') : '',
    isDefined,
  }
}

export function buildMatchSnapshot(apiMatch) {
  if (!apiMatch || typeof apiMatch !== 'object') {
    throw new Error('Resposta inválida da API de futebol.')
  }

  const rawStatus = apiMatch.status

  return {
    id: apiMatch.id,
    utcDate: apiMatch.utcDate,
    status: normalizeMatchStatus(rawStatus),
    rawStatus,
    minute: apiMatch.minute ?? null,
    venue: apiMatch.venue ?? null,
    matchday: apiMatch.matchday ?? null,
    stage: apiMatch.stage ?? '',
    group: apiMatch.group ?? null,
    homeTeam: mapTeam(apiMatch.homeTeam),
    awayTeam: mapTeam(apiMatch.awayTeam),
    score: resolveRegulationScoreFromApi(apiMatch.score),
    isLive: isLiveStatus(rawStatus),
  }
}
