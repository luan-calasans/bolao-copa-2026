import { Skeleton } from './Skeleton'

interface LoadingStateProps {
  lines?: number
}

export function LoadingState({ lines = 3 }: LoadingStateProps) {
  return (
    <div className="space-y-3 py-8" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={`h-4 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}
