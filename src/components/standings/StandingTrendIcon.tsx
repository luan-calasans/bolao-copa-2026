import type { StandingsTrend } from '../../utils/matchGroupStandings'

interface StandingTrendIconProps {
  trend: StandingsTrend
  showTrend?: boolean
}

export function StandingTrendIcon({ trend, showTrend = true }: StandingTrendIconProps) {
  if (!showTrend) {
    return <span className="inline-block h-4 w-4" aria-hidden="true" />
  }

  if (trend === 'up') {
    return (
      <span
        className="inline-flex h-4 w-4 items-center justify-center text-emerald-400"
        title="Subindo na classificação"
        aria-label="Subindo na classificação"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M8 3l5 6H3l5-6z" />
        </svg>
      </span>
    )
  }

  if (trend === 'down') {
    return (
      <span
        className="inline-flex h-4 w-4 items-center justify-center text-red-400"
        title="Descendo na classificação"
        aria-label="Descendo na classificação"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M8 13l5-6H3l5 6z" />
        </svg>
      </span>
    )
  }

  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center"
      title="Sem mudança na classificação"
      aria-label="Sem mudança na classificação"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" aria-hidden="true" />
    </span>
  )
}
