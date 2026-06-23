import { Skeleton } from '../ui/Skeleton'

export function MatchCardSkeleton() {
  return (
    <article className="relative flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-slate-700/40 bg-pitch-800/80">
      <div className="card-header-bar flex items-center justify-between gap-2 overflow-hidden rounded-t-2xl px-4 py-2.5">
        <Skeleton className="h-6 w-28 rounded-lg" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-b-2xl p-3 sm:p-5">
        <Skeleton className="mx-auto mb-4 h-3 w-24" />

        <div className="mb-3 flex min-w-0 items-start justify-between gap-1 sm:gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-5 flex shrink-0 items-center gap-1 sm:mt-6 sm:gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="mt-auto border-t border-slate-700/40 pt-3">
          <Skeleton className="mx-auto h-3 w-32" />
        </div>

        <Skeleton className="mt-4 h-10 w-full rounded-xl" />
      </div>
    </article>
  )
}
