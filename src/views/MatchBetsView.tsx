import { Link } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { MatchBetListSkeleton } from '../components/bet/MatchBetListSkeleton'
import { AiPredictionPanel } from '../components/bet/AiPredictionPanel'
import { BetsTable } from '../components/bet/BetsTable'
import { MatchDetailHero } from '../components/match/MatchDetailHero'
import { MatchDetailsSection } from '../components/match/MatchDetailsSection'
import { MatchYouTubeHighlightsButton } from '../components/match/MatchYouTubeHighlightsButton'
import { MatchGroupStandingsPanel } from '../components/match/MatchGroupStandingsPanel'
import { Button } from '../components/ui/Button'
import { DataReloadButton } from '../components/ui/DataReloadButton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useMatchBetsViewModel } from '../viewmodels/useMatchBetsViewModel'
import { useAiPrediction } from '../hooks/useAiPrediction'
import { canPlaceBet } from '../utils/matchStatus'
import { areMatchTeamsDefined, getTeamDisplayName } from '../utils/teamDisplay'
import { betPath } from '../routes/routePaths'

interface MatchBetsViewProps {
  matchId: number
}

export function MatchBetsView({ matchId }: MatchBetsViewProps) {
  const {
    match,
    rows,
    groupStandings,
    isLoading,
    isReloading,
    error,
    isEmpty,
    isFinished,
    exactCount,
    partialCount,
    reload,
  } = useMatchBetsViewModel(matchId)
  const { aiPrediction, isAiLoading, aiError, canRequestAi, requestAiPrediction } =
    useAiPrediction(match?.id ?? null)

  const homeName = match ? getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name) : ''
  const awayName = match ? getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name) : ''
  const betHref = match && canPlaceBet(match) ? betPath(match.id) : undefined

  return (
    <AppLayout betHref={betHref}>
      {isLoading ? (
        <>
          <PageHeader
            backTo="/"
            backLabel="Voltar aos jogos"
            title="Jogo"
            description="Carregando informações..."
            titleAction={<Skeleton className="h-10 w-24 rounded-xl" />}
          />
          <MatchBetListSkeleton />
        </>
      ) : (
        <>
          <PageHeader
            backTo="/"
            backLabel="Voltar aos jogos"
            title={match ? `${homeName} x ${awayName}` : 'Jogo'}
            description="Informações do confronto e palpites registrados."
            titleAction={
              match && canPlaceBet(match) ? (
                <Link to={`/palpite/${match.id}`} className="shrink-0">
                  <Button variant="gold">Palpitar</Button>
                </Link>
              ) : undefined
            }
          >
            {match && (
              <>
                {match.status !== 'finished' && (
                  <div className="mb-4 flex justify-center sm:justify-end">
                    <DataReloadButton
                      onReload={() => reload({ force: true, silent: true })}
                      isReloading={isReloading}
                      size="md"
                      className="w-auto min-w-[10rem]"
                    />
                  </div>
                )}
                <MatchDetailHero
                  match={match}
                  betCount={rows.length}
                  exactCount={exactCount}
                  partialCount={partialCount}
                  isFinished={isFinished}
                />
                {(match.isLive || match.status === 'finished') && (
                  <div className="mt-4">
                    <MatchYouTubeHighlightsButton match={match} />
                  </div>
                )}
                <MatchDetailsSection match={match} />
                {groupStandings && <MatchGroupStandingsPanel preview={groupStandings} />}
                {match.status !== 'finished' && areMatchTeamsDefined(match) && (
                  <AiPredictionPanel
                    className="mt-6"
                    aiPrediction={aiPrediction}
                    isAiLoading={isAiLoading}
                    aiError={aiError}
                    canRequestAi={canRequestAi}
                    onRequest={requestAiPrediction}
                  />
                )}
              </>
            )}
          </PageHeader>

          {error && (
            <ErrorState
              message={error.message}
              statusCode={error.statusCode}
              onRetry={() => reload({ force: true })}
            />
          )}

          {!error && !isEmpty && (
            <>
              <h2 className="mb-4 text-lg font-semibold text-white">Palpites</h2>
              <BetsTable items={rows.map((row) => ({ row, match: match! }))} showBetOutcome />
            </>
          )}

          {isEmpty && !error && (
            <EmptyState
              title="Nenhum palpite ainda"
              message="Seja o primeiro a palpitar neste jogo."
            />
          )}
        </>
      )}
    </AppLayout>
  )
}
