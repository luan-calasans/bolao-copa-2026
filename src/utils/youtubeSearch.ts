const YOUTUBE_TOURNAMENT_SUFFIX = 'FIFA WORLD CUP™ 2026'

function buildMatchupLabel(homeName: string, awayName: string): string {
  return `${homeName} x ${awayName}`
}

export function buildMatchYouTubeHighlightsQuery(homeName: string, awayName: string): string {
  return `Melhores Momentos ${buildMatchupLabel(homeName, awayName)} | ${YOUTUBE_TOURNAMENT_SUFFIX}`
}

export function buildMatchYouTubeLiveQuery(homeName: string, awayName: string): string {
  return `Cazé TV ${buildMatchupLabel(homeName, awayName)} | ${YOUTUBE_TOURNAMENT_SUFFIX}`
}

export function buildMatchYouTubeHighlightsSearchUrl(homeName: string, awayName: string): string {
  const query = buildMatchYouTubeHighlightsQuery(homeName, awayName)
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

export function buildMatchYouTubeLiveSearchUrl(homeName: string, awayName: string): string {
  const query = buildMatchYouTubeLiveQuery(homeName, awayName)
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
