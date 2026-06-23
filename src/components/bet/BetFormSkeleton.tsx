import { Skeleton } from '../ui/Skeleton'

export function BetFormSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-2xl animate-in fade-in duration-300 lg:mx-0 lg:max-w-none lg:sticky lg:top-6 lg:self-start"
      aria-busy="true"
      aria-label="Carregando formulário de palpite"
    >
      <div className="mb-6">
        <Skeleton className="mb-2 h-4 w-36" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      <div className="mb-6">
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-700/50 bg-pitch-800/60 px-3 py-4"
            >
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/50 bg-pitch-800/60 p-5">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center justify-center gap-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-11 w-16 rounded-xl" />
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4 text-center">
        <Skeleton className="mx-auto mb-2 h-4 w-24" />
        <Skeleton className="mx-auto h-9 w-20" />
      </div>

      <Skeleton className="mt-6 h-12 w-full rounded-xl" />
    </div>
  )
}
