import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { ScorersTable } from '../components/standings/ScorersTable'
import { TeamGoalsTable } from '../components/standings/TeamGoalsTable'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useScorersViewModel } from '../viewmodels/useScorersViewModel'

function ScorersTableSkeleton({ columns }: { columns: number }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-700/40">
          {Array.from({ length: columns }).map((_, index) => (
            <th key={index} className="px-4 py-3">
              <Skeleton className="h-4 w-14" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 8 }).map((_, index) => (
          <tr key={index} className="border-b border-slate-700/20 last:border-b-0">
            {Array.from({ length: columns }).map((__, cellIndex) => (
              <td key={cellIndex} className="px-4 py-3">
                <Skeleton className={`h-4 ${cellIndex === 1 ? 'w-40' : 'mx-auto w-10'}`} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ScorersSkeletonCard({ columns }: { columns: number }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
      <div className="border-b border-slate-700/40 bg-pitch-900/60 px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </div>
      <ScorersTableSkeleton columns={columns} />
    </div>
  )
}

function ScorersSkeleton() {
  return (
    <div
      className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Carregando artilharia"
    >
      <ScorersSkeletonCard columns={3} />
      <ScorersSkeletonCard columns={3} />
    </div>
  )
}

export function ScorersView() {
  const { scorers, teamGoals, isLoading, error, isEmpty, reload } = useScorersViewModel()
  const hasScorers = scorers.length > 0
  const hasTeamGoals = teamGoals.length > 0

  return (
    <AppLayout>
      <PageHeader
        title="Artilharia"
        description="Ranking de goleadores e gols por seleção na Copa do Mundo 2026."
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

      {!isLoading && !error && !isEmpty && (
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
          {hasScorers && (
            <section className={`min-w-0 ${!hasTeamGoals ? 'lg:col-span-2' : ''}`}>
              <ScorersTable scorers={scorers} />
            </section>
          )}

          {hasTeamGoals && (
            <section className={`min-w-0 ${!hasScorers ? 'lg:col-span-2' : ''}`}>
              <TeamGoalsTable entries={teamGoals} />
            </section>
          )}
        </div>
      )}
    </AppLayout>
  )
}
