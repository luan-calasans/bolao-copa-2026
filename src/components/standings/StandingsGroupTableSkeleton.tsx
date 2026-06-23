import { Skeleton } from '../ui/Skeleton'

export function StandingsGroupTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/40 bg-pitch-800/60">
      <div className="border-b border-slate-700/40 bg-pitch-900/60 px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-0 px-3 py-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 border-b border-slate-700/20 py-3 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-6 w-6 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-28 sm:w-36" />
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {Array.from({ length: 8 }).map((__, statIndex) => (
                <Skeleton key={statIndex} className="h-4 w-5" />
              ))}
            </div>
            <Skeleton className="h-4 w-8 shrink-0 sm:hidden" />
          </div>
        ))}
      </div>
    </div>
  )
}
