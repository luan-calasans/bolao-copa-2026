import { Skeleton } from '../ui/Skeleton'

export function MatchDetailHeroSkeleton() {
  return (
    <div
      className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4 sm:p-6"
      aria-hidden="true"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="flex items-center justify-between gap-3 sm:gap-6">
        <div className="flex flex-1 flex-col items-start gap-2">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex flex-1 flex-col items-end gap-2">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-700/40 pt-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="mb-1 h-3 w-12" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
