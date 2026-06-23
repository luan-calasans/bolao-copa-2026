function getPlacementStyles(position: number): string {
  if (position === 1) {
    return 'border-gold-400/50 bg-gold-500/15 text-gold-300'
  }

  if (position === 2) {
    return 'border-slate-400/50 bg-slate-400/10 text-slate-200'
  }

  if (position === 3) {
    return 'border-amber-600/50 bg-amber-700/15 text-amber-300'
  }

  return 'border-slate-600/50 bg-slate-700/30 text-slate-400'
}

interface RankingPlacementBadgeProps {
  position: number
}

export function RankingPlacementBadge({ position }: RankingPlacementBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${getPlacementStyles(position)}`}
      aria-label={`${position}º colocado no ranking`}
    >
      {position}º
    </span>
  )
}
