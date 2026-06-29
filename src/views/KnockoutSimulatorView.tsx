import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { KnockoutBracket } from '../components/knockout/KnockoutBracket'
import { KnockoutSimulatorInfo } from '../components/knockout/KnockoutSimulatorInfo'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { TeamCrest } from '../components/ui/TeamCrest'
import { getTeamDisplayName } from '../utils/teamDisplay'
import { useKnockoutSimulatorViewModel } from '../viewmodels/useKnockoutSimulatorViewModel'

function KnockoutSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  )
}

export function KnockoutSimulatorView() {
  const {
    bracket,
    isLoading,
    error,
    isEmpty,
    reload,
    pickWinner,
    setScore,
    resetSimulation,
    hasPicks,
    champion,
    isMatchPickable,
    getWinner,
    picks,
    scores,
  } = useKnockoutSimulatorViewModel()

  return (
    <AppLayout>
      <PageHeader
        title="Simulador mata-mata"
        description="Monte sua própria chave eliminatória clicando nas seleções para avançar cada confronto."
        titleAction={<KnockoutSimulatorInfo />}
      />

      {champion?.team && (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl border border-gold-400/30 bg-gold-400/5 px-4 py-4">
          <TeamCrest
            crest={champion.team.crest}
            name={champion.team.name}
            isDefined
            size="md"
            className="!h-10 !w-10 rounded-full"
          />
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-400/80">
              Campeão simulado
            </p>
            <p className="text-lg font-bold text-white">
              {getTeamDisplayName(champion.team.shortName, champion.team.name)}
            </p>
          </div>
        </div>
      )}

      {isLoading && <KnockoutSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Chaveamento indisponível"
          message="Não foi possível montar o simulador com os dados atuais."
        />
      )}

      {!isLoading && !error && bracket && !isEmpty && (
        <KnockoutBracket
          rounds={bracket.rounds}
          linkTeams={false}
          simulator={{
            onPickWinner: pickWinner,
            onScoreChange: setScore,
            isMatchPickable,
            getWinner,
            picks,
            scores,
            onResetSimulation: resetSimulation,
            hasPicks,
          }}
        />
      )}
    </AppLayout>
  )
}
