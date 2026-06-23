import { Skeleton } from '../ui/Skeleton'

function TeamCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700/40 bg-pitch-800/60 p-4">
      <Skeleton className="h-16 w-16 rounded-xl" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-10 rounded-full" />
    </div>
  )
}

export function TeamsGridSkeleton({ count = 15 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-busy="true"
      aria-label="Carregando seleções"
    >
      {Array.from({ length: count }).map((_, index) => (
        <TeamCardSkeleton key={index} />
      ))}
    </div>
  )
}
