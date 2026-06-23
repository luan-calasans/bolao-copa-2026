import { Skeleton } from '../ui/Skeleton'

function FilterCardSkeleton({ titleWidth = 'w-12' }: { titleWidth?: string }) {
  return (
    <div className="mb-2.5 rounded-2xl border border-slate-700/40 bg-pitch-800/40 p-3 sm:p-4">
      <Skeleton className={`mb-2 h-3.5 ${titleWidth}`} />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  )
}

export function StandingsFiltersSkeleton() {
  return (
    <div className="mb-4" aria-hidden="true">
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-3">
        <FilterCardSkeleton titleWidth="w-10" />
        <div className="hidden lg:block">
          <div className="mb-4 rounded-2xl border border-slate-700/40 bg-pitch-800/40 p-3 sm:p-4">
            <Skeleton className="mb-2 h-3.5 w-24" />
            <div className="flex gap-2 px-1">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
