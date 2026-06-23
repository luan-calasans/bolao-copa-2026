import { MatchDetailHeroSkeleton } from '../match/MatchDetailHeroSkeleton'
import { MatchDetailsSectionSkeleton } from '../match/MatchDetailsSectionSkeleton'
import { Skeleton } from '../ui/Skeleton'
import { BetsTableSkeleton } from './BetsTableSkeleton'

export function MatchBetListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando jogo e palpites">
      <div className="mb-4 flex justify-end">
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <MatchDetailHeroSkeleton />

      <MatchDetailsSectionSkeleton panelCount={2} />

      <div className="mt-6 rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="mt-4 text-center">
          <Skeleton className="mx-auto h-4 w-28" />
          <Skeleton className="mx-auto mt-2 h-10 w-24" />
        </div>
      </div>

      <Skeleton className="mb-4 mt-8 h-6 w-24" />
      <BetsTableSkeleton rowCount={4} />
    </div>
  )
}
