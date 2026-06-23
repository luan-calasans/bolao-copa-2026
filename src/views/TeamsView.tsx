import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { TeamCard } from '../components/team/TeamCard'
import { TeamsGridSkeleton } from '../components/team/TeamsGridSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useTeamsViewModel } from '../viewmodels/useTeamsViewModel'

export function TeamsView() {
  const { teams, isLoading, error, isEmpty, reload } = useTeamsViewModel()

  return (
    <AppLayout>
      <PageHeader title="Seleções" description="Todas as seleções participantes da Copa 2026." />

      {isLoading && <TeamsGridSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Nenhuma seleção encontrada"
          message="Não foi possível carregar as seleções da Copa."
        />
      )}

      {!isLoading && !error && !isEmpty && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {teams.map((team) => (
            <TeamCard key={team.id ?? team.name} team={team} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
