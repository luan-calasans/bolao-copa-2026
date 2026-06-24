import { Skeleton } from '../ui/Skeleton'

export function ParticipantBetsStatsSkeleton({ statCount = 5 }: { statCount?: number }) {
  const largeColsClass = statCount === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'

  return (
    <div
      className={`mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 ${largeColsClass}`}
      aria-hidden="true"
    >
      {Array.from({ length: statCount }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 px-4 py-3 text-center"
        >
          <Skeleton className="mx-auto h-8 w-12" />
          <Skeleton className="mx-auto mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function AllBetsStatsSkeleton() {
  return (
    <div className="mt-6 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 px-4 py-3 text-center"
        >
          <Skeleton className="mx-auto h-8 w-12" />
          <Skeleton className="mx-auto mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

export function AdminBetsStatsSkeleton() {
  return (
    <div className="mb-6 flex flex-wrap gap-6" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-5 w-24" />
      ))}
    </div>
  )
}
