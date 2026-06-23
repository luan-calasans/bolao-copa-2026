import { Skeleton } from '../ui/Skeleton'

function SidebarFilterSectionSkeleton({ itemCount }: { itemCount: number }) {
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <Skeleton className="mb-2 h-2.5 w-14" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: itemCount }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full max-w-[180px]" />
        ))}
      </div>
    </div>
  )
}

export function MatchFiltersSkeleton() {
  return (
    <aside
      className="lg:sticky lg:top-[calc(var(--app-header-height,6rem)+var(--app-main-padding-top,2rem)-0.5rem)] lg:z-10 lg:self-start"
      aria-hidden="true"
    >
      <div className="mb-4 lg:hidden">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>

      <div className="hidden lg:block lg:pr-2">
        <SidebarFilterSectionSkeleton itemCount={4} />
        <SidebarFilterSectionSkeleton itemCount={5} />
        <SidebarFilterSectionSkeleton itemCount={4} />
        <div className="py-2">
          <Skeleton className="mb-2 h-2.5 w-24" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="mt-3 h-10 w-full rounded-lg" />
      </div>
    </aside>
  )
}
