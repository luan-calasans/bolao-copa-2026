import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { BetsListSection } from '../components/bet/BetsListSection'
import { AllBetsStatsSkeleton } from '../components/bet/AllBetsStatsSkeleton'
import { BetsListSectionSkeleton } from '../components/bet/BetsListSectionSkeleton'
import { DeleteBetConfirmModal } from '../components/bet/DeleteBetConfirmModal'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { RankingPlacementBadge } from '../components/ranking/RankingPlacementBadge'
import { StatCard } from '../components/ui/StatCard'
import { useDeleteBetConfirmation } from '../hooks/useDeleteBetConfirmation'
import { useParticipantBetsViewModel } from '../viewmodels/useParticipantBetsViewModel'
import { formatEfficiencyPercent } from '../utils/betEfficiency'
import { APP_ROUTES } from '../routes/routePaths'
import type { BetResultFilter } from '../utils/betListFilters'

interface ParticipantBetsViewProps {
  personNameKey: string
  pageTitle?: string
  backTo?: string
  backLabel?: string
  description?: string
  allowDelete?: boolean
}

export function ParticipantBetsView({
  personNameKey,
  pageTitle,
  backTo = APP_ROUTES.ranking,
  backLabel = 'Voltar ao ranking',
  description = 'Palpites registrados por este participante, incluindo o palpite de campeão.',
  allowDelete = false,
}: ParticipantBetsViewProps) {
  const vm = useParticipantBetsViewModel(personNameKey, { allowDelete })
  const deleteConfirmation = useDeleteBetConfirmation(vm.removeBet ?? (async () => {}))
  const [resultFilter, setResultFilter] = useState<BetResultFilter>('all')

  function showAllBets() {
    setResultFilter('all')
  }

  return (
    <AppLayout>
      <PageHeader
        backTo={backTo}
        backLabel={backLabel}
        title={pageTitle ?? vm.displayName}
        titleBadge={
          vm.rankingPosition != null ? (
            <RankingPlacementBadge position={vm.rankingPosition} />
          ) : undefined
        }
        description={description}
      >
        {vm.isLoading && <AllBetsStatsSkeleton />}
        {!vm.isLoading && !vm.error && !vm.isEmpty && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {vm.rankingRow && (
              <StatCard
                label="Pontos"
                value={String(vm.rankingRow.totalPoints)}
                highlight
                active={resultFilter === 'all'}
                onClick={showAllBets}
              />
            )}
            <StatCard
              label="Palpites"
              value={String(vm.totalBets)}
              active={resultFilter === 'all'}
              onClick={showAllBets}
            />
            <StatCard
              label="Exatos"
              value={String(vm.totalExact)}
              active={resultFilter === 'exact'}
              clickable={vm.totalExact > 0}
              onClick={vm.totalExact > 0 ? () => setResultFilter('exact') : undefined}
            />
            <StatCard
              label="Parciais"
              value={String(vm.totalPartial)}
              active={resultFilter === 'partial'}
              clickable={vm.totalPartial > 0}
              onClick={vm.totalPartial > 0 ? () => setResultFilter('partial') : undefined}
            />
            <StatCard
              label="Erros"
              value={String(vm.totalMissed)}
              active={resultFilter === 'none'}
              clickable={vm.totalMissed > 0}
              onClick={vm.totalMissed > 0 ? () => setResultFilter('none') : undefined}
            />
            <StatCard
              label="Eficiência"
              value={formatEfficiencyPercent(vm.hitRateEfficiency)}
              clickable={false}
            />
          </div>
        )}
      </PageHeader>

      {vm.isLoading && (
        <BetsListSectionSkeleton
          showFilters={false}
          showReceiptLink
          showParticipantColumn={false}
          showActions={allowDelete}
        />
      )}
      {vm.error && (
        <ErrorState
          message={vm.error.message}
          statusCode={vm.error.statusCode}
          onRetry={vm.reload}
        />
      )}
      {vm.isEmpty && (
        <EmptyState
          title="Participante sem palpites"
          message="Não encontramos palpites registrados para este participante."
        />
      )}

      {!vm.isLoading && !vm.error && !vm.isEmpty && (
        <BetsListSection
          groups={vm.groups}
          searchInputId="participant-bets-search"
          sortable
          showFilters={false}
          linkParticipantProfile={false}
          showReceiptLink
          showParticipantColumn={false}
          searchPlaceholder="Buscar por confronto, campeão ou jogo..."
          resultFilter={resultFilter}
          onResultFilterChange={setResultFilter}
          showClearFilters
          deletingReceiptId={allowDelete ? vm.deletingReceiptId : undefined}
          onDelete={
            allowDelete && vm.removeBet
              ? (receiptId) => deleteConfirmation.requestDelete(receiptId)
              : undefined
          }
        />
      )}

      {allowDelete && (
        <DeleteBetConfirmModal
          isOpen={deleteConfirmation.isOpen}
          isDeleting={vm.deletingReceiptId === deleteConfirmation.pendingReceiptId}
          onConfirm={() => void deleteConfirmation.confirmDelete()}
          onCancel={deleteConfirmation.cancelDelete}
        />
      )}
    </AppLayout>
  )
}
