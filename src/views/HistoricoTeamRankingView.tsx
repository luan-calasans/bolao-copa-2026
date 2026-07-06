import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { HistoricoTeamStatsTable } from '../components/historico/HistoricoTeamStatsTable'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { APP_ROUTES } from '../routes/routePaths'
import { useHistoricoViewModel } from '../viewmodels/useHistoricoViewModel'

function HistoricoTeamRankingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando ranking histórico">
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}

export function HistoricoTeamRankingView() {
  const { teamStats, isLoading, error, isEmpty, reload } = useHistoricoViewModel()

  return (
    <AppLayout>
      <PageHeader
        title="Histórico por seleção"
        description="Títulos, finais disputadas, aproveitamento e desempenho em grupos e mata-mata nas Copas do Mundo (1930–2022)."
        showBack
        backTo={APP_ROUTES.historico}
      />

      {isLoading && <HistoricoTeamRankingSkeleton />}
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
          title="Ranking indisponível"
          message="Não foi possível carregar as estatísticas históricas das seleções."
        />
      )}

      {!isLoading && !error && !isEmpty && <HistoricoTeamStatsTable teamStats={teamStats} />}
    </AppLayout>
  )
}
