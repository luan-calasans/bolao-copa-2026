import { Skeleton } from '../ui/Skeleton'

interface MatchDetailsSectionSkeletonProps {
  className?: string
  panelCount?: number
}

export function MatchDetailsSectionSkeleton({
  className = 'mt-6',
  panelCount = 3,
}: MatchDetailsSectionSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`} aria-hidden="true">
      {Array.from({ length: panelCount }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-700/30 bg-pitch-900/40"
        >
          <div className="flex items-center justify-between border-b border-slate-700/30 px-4 py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="space-y-3 px-4 py-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
