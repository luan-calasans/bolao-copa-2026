import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { StandingsGroupStageInfo } from '../components/standings/StandingsGroupStageInfo'
import { StandingsGroupTable } from '../components/standings/StandingsGroupTable'
import { StandingsSkeleton } from '../components/standings/StandingsSkeleton'
import { StandingsThirdPlaceRanking } from '../components/standings/StandingsThirdPlaceRanking'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { DEFAULT_STANDINGS_GRID_COLUMNS, getStandingsGridClass } from '../utils/standingsGrid'
import { useStandingsViewModel } from '../viewmodels/useStandingsViewModel'

export function StandingsView() {
  const { standings, thirdPlaceRanking, isLoading, error, isEmpty, reload } = useStandingsViewModel()

  return (
    <AppLayout>
      <PageHeader
        title="Classificação"
        description="Tabelas dos grupos da Copa do Mundo 2026."
        titleAction={<StandingsGroupStageInfo />}
      />

      {!isLoading && !error && !isEmpty && thirdPlaceRanking.length > 0 && (
        <div className="mb-6">
          <StandingsThirdPlaceRanking entries={thirdPlaceRanking} />
        </div>
      )}

      {isLoading && <StandingsSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Classificação indisponível"
          message="Não foi possível montar as tabelas dos grupos da fase de grupos."
        />
      )}

      {!isLoading && !error && !isEmpty && (
        <div className={`grid gap-6 ${getStandingsGridClass(DEFAULT_STANDINGS_GRID_COLUMNS)}`}>
          {standings.map((standing) => (
            <StandingsGroupTable key={standing.group ?? standing.stage} standing={standing} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
