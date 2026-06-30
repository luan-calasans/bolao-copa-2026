import { Link } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { KnockoutBracket } from '../components/knockout/KnockoutBracket'
import { KnockoutInfoPanel } from '../components/knockout/KnockoutInfoPanel'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { APP_ROUTES } from '../routes/routePaths'
import { useKnockoutViewModel } from '../viewmodels/useKnockoutViewModel'

function KnockoutSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export function KnockoutView() {
  const { bracket, isLoading, error, isEmpty, reload } = useKnockoutViewModel()

  return (
    <AppLayout>
      <PageHeader
        title="Mata-mata"
        description="Chaveamento eliminatório da Copa do Mundo 2026, atualizado com a classificação dos grupos."
        titleAction={
          <Link to={APP_ROUTES.knockoutSimulator} className="hidden shrink-0 lg:inline-flex">
            <Button variant="gold">Simulador</Button>
          </Link>
        }
      />

      <KnockoutInfoPanel />

      {isLoading && <KnockoutSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Chaveamento indisponível"
          message="Não foi possível montar o mata-mata com os dados atuais."
        />
      )}

      {!isLoading && !error && bracket && !isEmpty && (
        <KnockoutBracket rounds={bracket.rounds} />
      )}
    </AppLayout>
  )
}
