import { Skeleton } from '../ui/Skeleton'

export function ChampionBetSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando palpite de campeão">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-5 sm:p-6">
        <Skeleton className="mb-2 h-4 w-40" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="mb-3 mt-6 h-4 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}
