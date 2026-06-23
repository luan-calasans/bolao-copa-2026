import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { MatchGrid } from '../components/match/MatchGrid'
import { TeamViewSkeleton } from '../components/team/TeamViewSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { TeamCrest } from '../components/ui/TeamCrest'
import { useTeamViewModel } from '../viewmodels/useTeamViewModel'
import { getTeamDisplayName } from '../utils/teamDisplay'

interface TeamViewProps {
  teamId: number
}

export function TeamView({ teamId }: TeamViewProps) {
  const { team, matches, isLoading, error, isEmpty, reload } = useTeamViewModel(teamId)

  const teamName = team ? getTeamDisplayName(team.shortName, team.name) : 'Seleção'

  return (
    <AppLayout>
      {isLoading ? (
        <TeamViewSkeleton />
      ) : (
        <>
          <PageHeader backTo="/times" backLabel="Voltar às seleções" title={teamName}>
            {team && (
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <TeamCrest
                  crest={team.crest}
                  name={teamName}
                  size="lg"
                  className="rounded-2xl bg-pitch-900/50 p-2"
                />
                <div className="space-y-1 text-sm text-slate-400">
                  {team.tla && (
                    <p>
                      Sigla: <span className="text-slate-200">{team.tla}</span>
                    </p>
                  )}
                  {team.venue && (
                    <p>
                      Estádio: <span className="text-slate-200">{team.venue}</span>
                    </p>
                  )}
                  {team.founded && (
                    <p>
                      Fundação: <span className="text-slate-200">{team.founded}</span>
                    </p>
                  )}
                  {team.coach?.name && (
                    <p>
                      Técnico: <span className="text-slate-200">{team.coach.name}</span>
                    </p>
                  )}
                  {team.website && (
                    <p>
                      Site:{' '}
                      <a
                        href={team.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold-400 transition hover:text-gold-300"
                      >
                        {team.website.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </PageHeader>

          {error && (
            <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
          )}
          {isEmpty && (
            <EmptyState
              title="Sem jogos"
              message="Esta seleção ainda não tem jogos registrados na Copa 2026."
            />
          )}

          {!error && !isEmpty && <MatchGrid matches={matches} />}
        </>
      )}
    </AppLayout>
  )
}
