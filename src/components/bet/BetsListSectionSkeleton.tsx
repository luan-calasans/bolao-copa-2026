import { Skeleton } from '../ui/Skeleton'
import { BetsTableSkeleton } from './BetsTableSkeleton'

interface BetsListSectionSkeletonProps {
  showFilters?: boolean
  showMatchMeta?: boolean
  showMatchTeams?: boolean
  showGeneratedAt?: boolean
  showActions?: boolean
  showReceiptLink?: boolean
  showParticipantColumn?: boolean
  rowCount?: number
}

export function BetsListSectionSkeleton({
  showFilters = true,
  showMatchMeta = true,
  showMatchTeams = true,
  showGeneratedAt = true,
  showActions = false,
  showReceiptLink = false,
  showParticipantColumn = true,
  rowCount = 5,
}: BetsListSectionSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Carregando palpites">
      {showFilters && (
        <div className="mb-6">
          <div className="mb-4 lg:hidden">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-700/40 bg-pitch-800/40 p-4"
              >
                <Skeleton className="mb-3 h-3 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Skeleton className="mb-4 h-12 w-full rounded-xl" />

      <BetsTableSkeleton
        rowCount={rowCount}
        showMatchMeta={showMatchMeta}
        showMatchTeams={showMatchTeams}
        showGeneratedAt={showGeneratedAt}
        showActions={showActions}
        showReceiptLink={showReceiptLink}
        showParticipantColumn={showParticipantColumn}
      />
    </div>
  )
}
