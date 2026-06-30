import type { Match } from '../../models/match'
import { getSecondaryScore } from '../../utils/matchScoreMeta'

interface MatchScoreDisplayProps {
  match: Match
  className?: string
  secondaryClassName?: string
  showSecondary?: boolean
  showSecondaryLabel?: boolean
}

export function MatchScoreDisplay({
  match,
  className = 'font-bold tabular-nums text-white',
  secondaryClassName = 'text-xs font-medium tabular-nums text-slate-400',
  showSecondary = true,
  showSecondaryLabel = true,
}: MatchScoreDisplayProps) {
  const { home, away } = match.score

  if (home === null || away === null) {
    return <span className={className}>{match.status === 'scheduled' ? 'vs' : '- × -'}</span>
  }

  const secondary = showSecondary ? getSecondaryScore(match) : null

  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span className={`tabular-nums ${className}`.trim()}>
        {home} × {away}
      </span>
      {secondary && (
        <span className={`block text-center ${secondaryClassName}`.trim()}>
          {showSecondaryLabel && (
            <>
              {secondary.label}
              <br />
            </>
          )}
          {secondary.home} × {secondary.away}
        </span>
      )}
    </span>
  )
}
