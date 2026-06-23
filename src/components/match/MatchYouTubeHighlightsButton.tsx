import type { Match } from '../../models/match'
import {
  buildMatchYouTubeHighlightsSearchUrl,
  buildMatchYouTubeLiveSearchUrl,
} from '../../utils/youtubeSearch'
import { getTeamDisplayName } from '../../utils/teamDisplay'

interface MatchYouTubeHighlightsButtonProps {
  match: Match
  className?: string
  shortFinishedLabel?: boolean
}

export function MatchYouTubeHighlightsButton({
  match,
  className = '',
  shortFinishedLabel = false,
}: MatchYouTubeHighlightsButtonProps) {
  const isLive = match.isLive
  const isFinished = match.status === 'finished'

  if (!isLive && !isFinished) {
    return null
  }

  const homeName = getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)
  const awayName = getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)
  const matchup = `${homeName} x ${awayName}`
  const href = isLive
    ? buildMatchYouTubeLiveSearchUrl(homeName, awayName)
    : buildMatchYouTubeHighlightsSearchUrl(homeName, awayName)
  const label = isLive
    ? `Buscar Cazé TV ${matchup} | FIFA WORLD CUP™ 2026 no YouTube`
    : `Buscar Melhores Momentos de ${matchup} | FIFA WORLD CUP™ 2026 no YouTube`

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`youtube-highlights-btn flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-200 sm:py-3 sm:text-sm ${className || 'w-full'}`.trim()}
      title={label}
      aria-label={label}
    >
      <YouTubeIcon className="youtube-highlights-icon h-4 w-4 shrink-0" />
      <span>{isLive ? 'Ver no YouTube' : shortFinishedLabel ? 'Highlights' : 'Melhores Momentos'}</span>
    </a>
  )
}

function YouTubeIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}
