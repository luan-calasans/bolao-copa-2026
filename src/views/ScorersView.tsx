import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { ScorersTable } from '../components/standings/ScorersTable'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useScorersViewModel } from '../viewmodels/useScorersViewModel'

function ScorersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function ScorersView() {
  const { scorers, isLoading, error, isEmpty, reload } = useScorersViewModel()

  return (
    <AppLayout>
      <PageHeader
        title="Artilharia"
        description="Ranking de goleadores da Copa do Mundo 2026."
      />

      {isLoading && <ScorersSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Artilharia indisponível"
          message="Não foi possível carregar o ranking de goleadores no momento."
        />
      )}

      {!isLoading && !error && !isEmpty && <ScorersTable scorers={scorers} />}
    </AppLayout>
  )
}
