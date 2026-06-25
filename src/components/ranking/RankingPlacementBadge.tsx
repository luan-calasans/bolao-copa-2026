function getPlacementStyles(position: number): string {
  if (position === 1) {
    return 'border-[#ffdf00]/50 bg-[#ffdf00]/15 podium-name-first'
  }

  if (position === 2) {
    return 'border-slate-400/50 bg-slate-400/10 podium-name-second'
  }

  if (position === 3) {
    return 'border-amber-600/50 bg-amber-700/15 podium-name-third'
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
