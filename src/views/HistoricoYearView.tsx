import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { HistoricoYearNav } from '../components/historico/HistoricoYearNav'
import { KnockoutBracket } from '../components/knockout/KnockoutBracket'
import { ScorersTable } from '../components/standings/ScorersTable'
import { StandingsGroupTable } from '../components/standings/StandingsGroupTable'
import { TeamGoalsTable } from '../components/standings/TeamGoalsTable'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { APP_ROUTES } from '../routes/routePaths'
import { getHistoricalTeamDisplayName } from '../utils/historicalTeamNames'
import { DEFAULT_STANDINGS_GRID_COLUMNS, getStandingsGridClass } from '../utils/standingsGrid'
import { useHistoricoYearViewModel } from '../viewmodels/useHistoricoYearViewModel'

interface HistoricoYearViewProps {
  year: number
  availableYears: number[]
}

function HistoricoYearSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando edição histórica">
      <Skeleton className="h-10 w-full max-w-3xl rounded-full" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}

export function HistoricoYearView({ year, availableYears }: HistoricoYearViewProps) {
  const {
    tournament,
    bracket,
    standings,
    scorers,
    teamGoals,
    showKnockout,
    showDesktopKnockout,
    isLoading,
    error,
    isEmpty,
    reload,
  } = useHistoricoYearViewModel(year)

  const hasScorers = scorers.length > 0
  const hasTeamGoals = teamGoals.length > 0
  const hasStandings = standings.length > 0

  const championName = tournament
    ? getHistoricalTeamDisplayName(tournament.summary.champion)
    : null
  const runnerUpName = tournament?.summary.runnerUp
    ? getHistoricalTeamDisplayName(tournament.summary.runnerUp)
    : null

  return (
    <AppLayout>
      <PageHeader
        title={`Copa do Mundo ${year}`}
        description={
          tournament?.summary.hostNote
            ? `${championName} campeã · ${tournament.summary.hostNote}`
            : `${championName ?? 'Campeã'}${runnerUpName ? ` venceu ${runnerUpName}` : ''}${tournament?.summary.finalScore ? ` (${tournament.summary.finalScore})` : ''}`
        }
        showBack
        backTo={APP_ROUTES.historico}
      />

      <HistoricoYearNav years={availableYears} currentYear={year} />

      {isLoading && <HistoricoYearSkeleton />}
      {error && (
        <ErrorState
          message={error.message}
          statusCode={error.statusCode}
          onRetry={reload}
          retryHint="Não foi possível ler os arquivos históricos em public/data. Verifique se os JSONs estão no projeto e tente novamente."
        />
      )}
      {isEmpty && (
        <EmptyState
          title="Edição indisponível"
          message={`Não foi possível carregar os dados da Copa de ${year}.`}
        />
      )}

      {!isLoading && !error && !isEmpty && tournament && (
        <div className="space-y-10">
          <section className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4 sm:p-6">
            <h2 className="text-base font-bold text-white sm:text-lg">Resumo da edição</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Campeão</dt>
                <dd className="mt-1 text-lg font-semibold text-gold-400">{championName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Vice-campeão</dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {runnerUpName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Placar decisivo</dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {tournament.summary.finalScore ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Jogos</dt>
                <dd className="mt-1 text-lg font-semibold text-white">{tournament.matches.length}</dd>
              </div>
            </dl>
          </section>

          {showKnockout && bracket && (
            <section>
              <h2 className="mb-4 text-base font-bold text-white sm:text-lg">Mata-mata</h2>
              <KnockoutBracket rounds={bracket.rounds} showDesktop={showDesktopKnockout} linkTeams={false} />
            </section>
          )}

          {hasStandings && (
            <section>
              <h2 className="mb-4 text-base font-bold text-white sm:text-lg">Fase de grupos</h2>
              <div className={`grid gap-6 ${getStandingsGridClass(DEFAULT_STANDINGS_GRID_COLUMNS)}`}>
                {standings.map((standing) => (
                  <StandingsGroupTable
                    key={standing.group ?? standing.stage}
                    standing={standing}
                    linkTeams={false}
                    showPositionColors={false}
                  />
                ))}
              </div>
            </section>
          )}

          {(hasScorers || hasTeamGoals) && (
            <section>
              <h2 className="mb-4 text-base font-bold text-white sm:text-lg">Artilharia</h2>
              <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
                {hasScorers && (
                  <div className={!hasTeamGoals ? 'lg:col-span-2' : 'min-w-0'}>
                    <ScorersTable scorers={scorers} linkTeams={false} />
                  </div>
                )}
                {hasTeamGoals && (
                  <div className={!hasScorers ? 'lg:col-span-2' : 'min-w-0'}>
                    <TeamGoalsTable entries={teamGoals} linkTeams={false} />
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </AppLayout>
  )
}
