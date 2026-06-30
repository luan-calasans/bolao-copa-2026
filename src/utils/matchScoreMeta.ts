import type { Match } from '../models/match'

export function getSecondaryScore(match: Match): {
  label: string
  home: number
  away: number
} | null {
  const { home, away } = match.score
  if (home == null || away == null) return null

  const penalties = match.penalties
  if (penalties?.home != null && penalties?.away != null) {
    return { label: 'Pênaltis', home: penalties.home, away: penalties.away }
  }

  const extraTime = match.extraTime
  if (extraTime?.home != null && extraTime?.away != null) {
    return {
      label: 'Prorrogação',
      home: home + extraTime.home,
      away: away + extraTime.away,
    }
  }

  return null
}

export function buildMatchScoreMetaLine(match: Match, includeHalfTime: boolean): string | null {
  const parts: string[] = []
  const secondary = getSecondaryScore(match)

  if (secondary) {
    parts.push(`${secondary.label} ${secondary.home} × ${secondary.away}`)
  }

  if (includeHalfTime) {
    const { home, away } = match.halfTimeScore
    if (home !== null && away !== null) {
      parts.push(`Intervalo ${home} × ${away}`)
    }
  }

  return parts.length > 0 ? parts.join(' | ') : null
}
