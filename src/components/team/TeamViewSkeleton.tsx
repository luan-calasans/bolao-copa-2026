import { MatchListSkeleton } from '../match/MatchListSkeleton'
import { Skeleton } from '../ui/Skeleton'

export function TeamViewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando seleção">
      <div className="mb-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-4 h-8 w-48 sm:h-9" />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      <MatchListSkeleton count={3} sections={1} />
    </div>
  )
}
