import { DEFAULT_STANDINGS_GRID_COLUMNS, getStandingsGridClass } from '../../utils/standingsGrid'
import { StandingsFiltersSkeleton } from './StandingsFiltersSkeleton'
import { StandingsGroupTableSkeleton } from './StandingsGroupTableSkeleton'

interface StandingsSkeletonProps {
  groupCount?: number
}

export function StandingsSkeleton({ groupCount = 12 }: StandingsSkeletonProps) {
  return (
    <div className="animate-in fade-in duration-300" aria-busy="true" aria-label="Carregando classificação">
      <StandingsFiltersSkeleton />

      <div className={`grid gap-6 ${getStandingsGridClass(DEFAULT_STANDINGS_GRID_COLUMNS)}`}>
        {Array.from({ length: groupCount }).map((_, index) => (
          <StandingsGroupTableSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
