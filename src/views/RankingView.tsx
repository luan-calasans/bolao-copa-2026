import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { RankingRulesInfo } from '../components/ranking/RankingRules'
import { RankingSkeleton } from '../components/ranking/RankingSkeleton'
import { RankingTable } from '../components/ranking/RankingTable'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useRankingViewModel } from '../viewmodels/useRankingViewModel'

function formatSyncedAt(value: string | null): string | null {
  if (!value) return null

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return null
  }
}

export function RankingView() {
  const { ranking, rules, syncedAt, isLoading, error, isEmpty, reload } = useRankingViewModel()
  const syncedLabel = formatSyncedAt(syncedAt)

  return (
    <AppLayout>
      <PageHeader
        title="Ranking"
        showBack={false}
        titleAction={
          isLoading ? <Skeleton className="h-9 w-9 rounded-full" /> : !error ? (
            <RankingRulesInfo rules={rules} />
          ) : undefined
        }
      >
        {syncedLabel && !isLoading && !error && (
          <p className="mt-3 text-xs text-slate-500">Atualizado em {syncedLabel}</p>
        )}
      </PageHeader>

      {isLoading && <RankingSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}

      {!isLoading && !error && (
        <>
          {isEmpty ? (
            <EmptyState
              title="Ranking vazio"
              message="Quando houver palpites registrados, a pontuação aparecerá aqui."
            />
          ) : (
            <RankingTable ranking={ranking} />
          )}
        </>
      )}
    </AppLayout>
  )
}
