import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { HistoricoChampionsSection } from '../components/historico/HistoricoChampionsSection'
import { HistoricoOverviewStats } from '../components/historico/HistoricoOverviewStats'
import { HistoricoRecentChampions } from '../components/historico/HistoricoRecentChampions'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useHistoricoViewModel } from '../viewmodels/useHistoricoViewModel'

function HistoricoSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Carregando histórico da Copa">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  )
}

export function HistoricoView() {
  const { summaries, teamStats, isLoading, error, isEmpty, reload } = useHistoricoViewModel()

  return (
    <AppLayout>
      <PageHeader
        title="Histórico da Copa"
        description="Campeões e detalhe de cada edição entre 1930 e 2022."
      />

      {isLoading && <HistoricoSkeleton />}
      {error && (
        <ErrorState
          message={error.message}
          statusCode={error.statusCode}
          onRetry={reload}
          retryHint="Não foi possível ler os arquivos históricos em public/data. Verifique se os JSONs estão no projeto e tente novamente."
        />
      )}
      {isEmpty && (
        <EmptyState
          title="Histórico indisponível"
          message="Não foi possível carregar os dados históricos da Copa do Mundo."
        />
      )}

      {!isLoading && !error && !isEmpty && (
        <div className="space-y-10">
          <HistoricoOverviewStats summaries={summaries} teamStats={teamStats} />
          <HistoricoRecentChampions summaries={summaries} />
          <HistoricoChampionsSection summaries={summaries} />
        </div>
      )}
    </AppLayout>
  )
}
