import { Skeleton } from '../ui/Skeleton'

export function ReceiptTicketSkeleton() {
  return (
    <div
      className="mx-auto w-[360px] max-w-full overflow-hidden rounded-3xl border-2 border-slate-700/40 bg-pitch-900"
      aria-busy="true"
      aria-label="Carregando comprovante"
    >
      <Skeleton className="h-16 w-full rounded-none" />

      <div className="space-y-5 px-5 py-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <Skeleton className="h-6 w-full max-w-[280px] rounded-lg" />
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="px-1 text-center">
            <Skeleton className="mx-auto h-8 w-20" />
            <Skeleton className="mx-auto mt-1 h-3 w-12" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        <div className="space-y-2.5 border-t border-dashed border-slate-700/40 pt-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="ml-auto h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1 opacity-60">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-1 rounded-full" />
          ))}
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-none" />
    </div>
  )
}
