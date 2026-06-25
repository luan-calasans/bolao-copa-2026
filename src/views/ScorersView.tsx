import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { ScorersTable } from '../components/standings/ScorersTable'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useScorersViewModel } from '../viewmodels/useScorersViewModel'

function ScorersSkeleton() {
  return (
    <div
      className="w-fit max-w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40"
      aria-busy="true"
      aria-label="Carregando artilharia"
    >
      <table className="w-auto text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              {['#', 'Jogador', 'Gols'].map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <Skeleton className="h-4 w-14" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, index) => (
              <tr key={index} className="border-b border-slate-700/20 last:border-b-0">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-6" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="mx-auto h-5 w-10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
