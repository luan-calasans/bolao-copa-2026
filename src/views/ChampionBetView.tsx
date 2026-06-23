import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { ChampionBetForm } from '../components/champion/ChampionBetForm'
import { ChampionBetSkeleton } from '../components/champion/ChampionBetSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useChampionBetViewModel } from '../viewmodels/useChampionBetViewModel'
import { CHAMPION_BET_POINTS, formatChampionDeadline } from '../utils/championBet'

export function ChampionBetView() {
  const vm = useChampionBetViewModel()
  const deadlineLabel = formatChampionDeadline(vm.meta?.deadline ?? null)

  return (
    <AppLayout>
      <PageHeader
        title="Palpite de campeão"
        description={`Escolha quem vencerá a Copa do Mundo e ganhe ${CHAMPION_BET_POINTS} pontos se acertar.`}
      >
        {deadlineLabel && (
          <p className="mt-3 text-xs text-slate-500">
            Prazo para palpitar: até {deadlineLabel} (um dia antes da final)
          </p>
        )}
      </PageHeader>

      {vm.isLoading && <ChampionBetSkeleton />}
      {vm.error && (
        <ErrorState message={vm.error.message} statusCode={vm.error.statusCode} onRetry={vm.reload} />
      )}

      {!vm.isLoading && !vm.error && vm.isEmpty && (
        <EmptyState
          title="Nenhuma seleção encontrada"
          message="Não foi possível carregar as seleções da Copa."
        />
      )}

      {!vm.isLoading && !vm.error && !vm.isEmpty && (
        <ChampionBetForm
          teams={vm.teams}
          personName={vm.personName}
          selectedTeamId={vm.selectedTeamId}
          validationError={vm.validationError}
          isSubmitting={vm.isSubmitting}
          canPlaceBet={vm.canPlaceBet}
          betBlockedMessage={vm.betBlockedMessage}
          onPersonNameChange={vm.setPersonName}
          onTeamSelect={vm.setSelectedTeamId}
          onConfirm={vm.confirmBet}
        />
      )}
    </AppLayout>
  )
}
