import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { AiSuggestionButton } from '../components/bet/AiSuggestionButton'
import { AiPredictionModal } from '../components/bet/AiPredictionModal'
import { BetForm } from '../components/bet/BetForm'
import { BetFormSkeleton } from '../components/bet/BetFormSkeleton'
import { MatchDetailHeroSkeleton } from '../components/match/MatchDetailHeroSkeleton'
import { MatchDetailsSectionSkeleton } from '../components/match/MatchDetailsSectionSkeleton'
import { MatchDetailHero } from '../components/match/MatchDetailHero'
import { MatchDetailsSection } from '../components/match/MatchDetailsSection'
import { MatchYouTubeHighlightsButton } from '../components/match/MatchYouTubeHighlightsButton'
import { DataReloadButton } from '../components/ui/DataReloadButton'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useBetViewModel } from '../viewmodels/useBetViewModel'
import { getTeamDisplayName } from '../utils/teamDisplay'
import { useParticipant } from '../hooks/useParticipant'

interface BetViewProps {
  matchId: number
}

export function BetView({ matchId }: BetViewProps) {
  const vm = useBetViewModel(matchId)
  const { participant, isAdmin } = useParticipant()
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const isPersonNameLocked = Boolean(participant) && !isAdmin

  const homeName = vm.match
    ? getTeamDisplayName(vm.match.homeTeam.shortName, vm.match.homeTeam.name)
    : ''
  const awayName = vm.match
    ? getTeamDisplayName(vm.match.awayTeam.shortName, vm.match.awayTeam.name)
    : ''

  if (vm.isLoading) {
    return (
      <AppLayout>
        <PageHeader
          backTo={`/jogo/${matchId}/palpites`}
          backLabel="Voltar ao jogo"
          title="Palpitar"
          description="Carregando informações do jogo..."
        />
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div className="order-1 min-w-0">
            <MatchDetailHeroSkeleton />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="order-2 min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <BetFormSkeleton />
          </div>
          <div className="order-3 min-w-0">
            <MatchDetailsSectionSkeleton />
          </div>
        </div>
      </AppLayout>
    )
  }

  const showMatchInfo = Boolean(vm.match && !vm.error)
  const showAiSuggestion = showMatchInfo && vm.canPlaceBet
  const showReloadButton = Boolean(vm.match?.isLive)
  const showActionButtons = showAiSuggestion || showReloadButton
  const hasBothActionButtons = showAiSuggestion && showReloadButton

  function handleOpenAiModal() {
    setIsAiModalOpen(true)

    if (vm.canRequestAi && !vm.isAiLoading) {
      vm.requestAiPrediction()
    }
  }

  return (
    <AppLayout>
      <PageHeader
        backTo={`/jogo/${matchId}/palpites`}
        backLabel="Voltar ao jogo"
        title={vm.match ? `${homeName} x ${awayName}` : 'Palpitar'}
        description={
          isPersonNameLocked
            ? 'Escolha quem vence e/ou o placar previsto. As opções podem ser diferentes entre si.'
            : 'Informe seu nome e quem vence e/ou o placar previsto. As opções podem ser diferentes entre si.'
        }
      />

      <AiPredictionModal
        isOpen={isAiModalOpen}
        aiPrediction={vm.aiPrediction}
        isAiLoading={vm.isAiLoading}
        aiError={vm.aiError}
        canRequestAi={vm.canRequestAi}
        onClose={() => setIsAiModalOpen(false)}
        onRequest={vm.requestAiPrediction}
        onApply={vm.applyAiPrediction}
      />

      {vm.error && (
        <ErrorState
          message={vm.error.message}
          statusCode={vm.error.statusCode}
          onRetry={
            vm.error.statusCode === 401 ||
            vm.error.statusCode === 403 ||
            vm.error.statusCode === 503
              ? undefined
              : () => vm.reload()
          }
        />
      )}

      {showMatchInfo && vm.match && (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div className="order-1 min-w-0">
            <MatchDetailHero match={vm.match} betCount={vm.betCount} />

            {showActionButtons && (
              <div className="mt-4 grid w-full grid-cols-2 gap-3">
                {showAiSuggestion && (
                  <AiSuggestionButton
                    onClick={handleOpenAiModal}
                    isLoading={vm.isAiLoading && isAiModalOpen}
                    className={hasBothActionButtons ? '' : 'col-span-2'}
                  />
                )}
                {showReloadButton && (
                  <DataReloadButton
                    onReload={() => vm.reload({ silent: true })}
                    isReloading={vm.isReloading}
                    size="md"
                    className={`w-full ${hasBothActionButtons ? '' : 'col-span-2'}`}
                  />
                )}
              </div>
            )}

            {(vm.match.isLive || vm.match.status === 'finished') && (
              <div className="mt-4">
                <MatchYouTubeHighlightsButton match={vm.match} />
              </div>
            )}

            {!vm.error && vm.betBlockedMessage && (
              <p className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100 lg:text-left">
                {vm.betBlockedMessage}
              </p>
            )}
          </div>

          {vm.canPlaceBet && (
            <div className="order-2 min-w-0 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
              <BetForm
                match={vm.match}
                personName={vm.personName}
                winnerPick={vm.winnerPick}
                homeScore={vm.homeScore}
                awayScore={vm.awayScore}
                minHomeScore={vm.minHomeScore}
                minAwayScore={vm.minAwayScore}
                validationError={vm.validationError}
                isSubmitting={vm.isSubmitting}
                isFormDirty={vm.isFormDirty}
                complementMode={vm.complementMode}
                isScoreLocked={vm.isScoreLocked}
                isWinnerLocked={vm.isWinnerLocked}
                isPersonNameLocked={isPersonNameLocked}
                onPersonNameChange={vm.setPersonName}
                onWinnerPickChange={vm.setWinnerPick}
                onHomeScoreChange={vm.setHomeScore}
                onAwayScoreChange={vm.setAwayScore}
                onClearScorePick={vm.clearScorePick}
                onConfirm={vm.confirmBet}
                onReset={vm.resetForm}
              />
            </div>
          )}

          <div className={`order-3 min-w-0 ${vm.canPlaceBet ? '' : 'lg:col-span-2'}`}>
            <MatchDetailsSection match={vm.match} />
          </div>
        </div>
      )}
    </AppLayout>
  )
}
