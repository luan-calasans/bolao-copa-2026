import { MatchCardSkeleton } from './MatchCardSkeleton'
import { Skeleton } from '../ui/Skeleton'
import type { MatchGridColumns } from '../../utils/matchGrid'
import { getMatchGridClass } from '../../utils/matchGrid'

interface MatchListSkeletonProps {
  count?: number
  columnsPerRow?: MatchGridColumns
  sections?: number
}

function MatchSectionSkeleton({
  count,
  columnsPerRow,
}: {
  count: number
  columnsPerRow: MatchGridColumns
}) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <div className={`grid min-w-0 gap-4 ${getMatchGridClass(columnsPerRow)}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="min-w-0">
            <MatchCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}

export function MatchListSkeleton({
  count = 3,
  columnsPerRow = 3,
  sections = 3,
}: MatchListSkeletonProps) {
  return (
    <div className="animate-in fade-in duration-300" aria-busy="true" aria-label="Carregando jogos">
      {Array.from({ length: sections }).map((_, index) => (
        <MatchSectionSkeleton key={index} count={count} columnsPerRow={columnsPerRow} />
      ))}
    </div>
  )
}
