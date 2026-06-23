import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { BetsListSection } from '../components/bet/BetsListSection'
import { AllBetsStatsSkeleton } from '../components/bet/AllBetsStatsSkeleton'
import { BetsListSectionSkeleton } from '../components/bet/BetsListSectionSkeleton'
import { RankingRulesInfo } from '../components/ranking/RankingRules'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { StatCard } from '../components/ui/StatCard'
import { useAllBetsViewModel } from '../viewmodels/useAllBetsViewModel'
import { SCORING_RULES } from '../utils/betScoring'
import type { BetResultFilter } from '../utils/betListFilters'

export function AllBetsView() {
  const { groups, totalBets, totalExact, totalPartial, totalMissed, isLoading, error, isEmpty, reload } =
    useAllBetsViewModel()
  const [resultFilter, setResultFilter] = useState<BetResultFilter>('all')

  function showAllBets() {
    setResultFilter('all')
  }

  return (
    <AppLayout>
      <PageHeader
        backTo="/"
        backLabel="Voltar aos jogos"
        title="Todos os palpites"
        description="Palpites registrados em todos os jogos do bolão."
        titleAction={<RankingRulesInfo rules={SCORING_RULES} />}
      >
        {isLoading && <AllBetsStatsSkeleton />}
        {!isLoading && !error && totalBets > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Palpites"
              value={String(totalBets)}
              active={resultFilter === 'all'}
              onClick={showAllBets}
            />
            <StatCard
              label="Exatos"
              value={String(totalExact)}
              active={resultFilter === 'exact'}
              clickable={totalExact > 0}
              onClick={totalExact > 0 ? () => setResultFilter('exact') : undefined}
            />
            <StatCard
              label="Parciais"
              value={String(totalPartial)}
              active={resultFilter === 'partial'}
              clickable={totalPartial > 0}
              onClick={totalPartial > 0 ? () => setResultFilter('partial') : undefined}
            />
            <StatCard
              label="Erros"
              value={String(totalMissed)}
              active={resultFilter === 'none'}
              clickable={totalMissed > 0}
              onClick={totalMissed > 0 ? () => setResultFilter('none') : undefined}
            />
          </div>
        )}
      </PageHeader>

      {isLoading && <BetsListSectionSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Nenhum palpite registrado"
          message="Os palpites feitos no bolão aparecerão aqui em uma única tabela."
        />
      )}

      {!isLoading && !error && !isEmpty && (
        <BetsListSection
          groups={groups}
          searchInputId="bets-search"
          sortable
          showGeneratedAt
          resultFilter={resultFilter}
          onResultFilterChange={setResultFilter}
        />
      )}
    </AppLayout>
  )
}
