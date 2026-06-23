import { Skeleton } from '../ui/Skeleton'

interface BetsTableSkeletonProps {
  rowCount?: number
  showMatchMeta?: boolean
  showMatchTeams?: boolean
  showGeneratedAt?: boolean
  showActions?: boolean
  showReceiptLink?: boolean
  showParticipantColumn?: boolean
}

export function BetsTableSkeleton({
  rowCount = 5,
  showMatchMeta = false,
  showMatchTeams = false,
  showGeneratedAt = false,
  showActions = false,
  showReceiptLink = false,
  showParticipantColumn = true,
}: BetsTableSkeletonProps) {
  const columnCount =
    2 +
    (showParticipantColumn ? 1 : 0) +
    (showMatchMeta ? 1 : 0) +
    (showMatchTeams ? 1 : 0) +
    (showGeneratedAt ? 1 : 0) +
    (showReceiptLink ? 1 : 0) +
    (showActions ? 1 : 0)

  return (
    <>
      <ul className="space-y-3 lg:hidden" aria-hidden="true">
        {Array.from({ length: rowCount }).map((_, index) => (
          <li key={index} className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4">
            {showMatchMeta && <Skeleton className="mb-3 h-4 w-3/4" />}
            {showMatchTeams && <Skeleton className="mb-3 h-5 w-full" />}
            {showParticipantColumn && <Skeleton className="h-5 w-48" />}
            {showGeneratedAt && <Skeleton className="mt-2 h-3 w-40" />}
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-14 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-full" />
              {showReceiptLink && <Skeleton className="h-9 w-9 rounded-lg" />}
            </div>
            {showActions && <Skeleton className="mt-3 h-7 w-16 rounded-full" />}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-700/50 bg-pitch-800/40 lg:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-pitch-900/40">
            <tr>
              {Array.from({ length: columnCount }).map((_, index) => (
                <th key={index} className="border-b border-slate-700/40 px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, index) => (
              <tr key={index} className="border-b border-slate-700/30 last:border-b-0">
                {Array.from({ length: columnCount }).map((_, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
                    <Skeleton
                      className={`h-5 ${cellIndex >= columnCount - 2 ? 'mx-auto w-16' : 'w-full max-w-[8rem]'}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
