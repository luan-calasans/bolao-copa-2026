import { useState, type ReactNode } from 'react'
import type { Match } from '../../models/match'
import type {
  MatchDetails,
  MatchEventInfo,
  MatchGoal,
  MatchLineupPlayer,
  MatchLineups,
  MatchStat,
  MatchTimelineEvent,
} from '../../models/sportsdb.types'
import { MatchDetailsSectionSkeleton } from './MatchDetailsSectionSkeleton'
import { useMatchDetails } from '../../hooks/useMatchDetails'
import { TeamCrest } from '../ui/TeamCrest'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { formatMatchGoalDetail, formatSubstitutionTimelineDisplay, getMatchEventDetailClassName } from '../../utils/matchEventDetailPt'
import { translateLineupPosition } from '../../utils/matchLineupPositionPt'
import { formatTimelineDetail } from '../../utils/matchTimelineMapper'

interface MatchDetailsSectionProps {
  match: Match
}

function CollapsiblePanelShell({
  title,
  badge,
  count,
  defaultExpanded = true,
  panelId,
  children,
}: {
  title: string
  badge?: ReactNode
  count?: number
  defaultExpanded?: boolean
  panelId: string
  children: ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <section className="mt-6 rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className="inline-flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
          {badge}
        </span>
        <span className="inline-flex shrink-0 items-center gap-2">
          {count != null && (
            <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-400">
              {count}
            </span>
          )}
          <ChevronIcon
            className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={isExpanded ? 'mt-4' : ''}>{children}</div>
        </div>
      </div>
    </section>
  )
}

function PanelShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
      {children}
    </section>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-200">{value}</dd>
    </div>
  )
}

function MatchMetaPanel({ info }: { info: MatchEventInfo }) {
  const items: Array<{ label: string; value: string }> = []

  if (info.league) items.push({ label: 'Competição', value: info.league })
  if (info.season) items.push({ label: 'Temporada', value: info.season })
  if (info.venue) items.push({ label: 'Estádio', value: info.venue })
  if (info.city || info.country) {
    items.push({
      label: 'Local',
      value: [info.city, info.country].filter(Boolean).join(', '),
    })
  }
  if (info.spectators != null) {
    items.push({ label: 'Público', value: info.spectators.toLocaleString('pt-BR') })
  }
  if (info.referee) items.push({ label: 'Árbitro', value: info.referee })

  if (items.length === 0) return null

  return (
    <CollapsiblePanelShell title="Informações" panelId="match-info-panel">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {items.map((item) => (
          <MetaItem key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </CollapsiblePanelShell>
  )
}

function StatRow({ stat }: { stat: MatchStat }) {
  if (stat.isPercentage && stat.homeNumeric != null && stat.awayNumeric != null) {
    const total = stat.homeNumeric + stat.awayNumeric || 1
    const homeWidth = Math.round((stat.homeNumeric / total) * 100)
    const awayWidth = 100 - homeWidth

    return (
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-300">
          <span>{stat.homeValue}</span>
          <span>{stat.label}</span>
          <span>{stat.awayValue}</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-pitch-950">
          <div className="bg-emerald-500/80" style={{ width: `${homeWidth}%` }} />
          <div className="bg-slate-500/80" style={{ width: `${awayWidth}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
      <span className="text-right font-semibold tabular-nums text-white">{stat.homeValue}</span>
      <span className="text-center text-xs text-slate-400">{stat.label}</span>
      <span className="font-semibold tabular-nums text-white">{stat.awayValue}</span>
    </div>
  )
}

function MatchStatsPanel({ stats }: { stats: MatchStat[] }) {
  if (stats.length === 0) return null

  const featured = stats.filter((stat) =>
    ['Posse de bola', 'Chutes no gol', 'Total de chutes', 'Escanteios', 'Faltas'].includes(stat.label),
  )
  const displayStats = featured.length > 0 ? featured : stats.slice(0, 8)

  return (
    <CollapsiblePanelShell title="Estatísticas" panelId="match-stats-panel">
      <div className="space-y-4">
        {displayStats.map((stat) => (
          <StatRow key={stat.id} stat={stat} />
        ))}
      </div>
    </CollapsiblePanelShell>
  )
}

function EventDetailLabel({ detail }: { detail: string }) {
  const className = getMatchEventDetailClassName(detail)

  if (!className) {
    return <>{detail}</>
  }

  return <span className={className}>{detail}</span>
}

function GoalRow({ goal, match }: { goal: MatchGoal; match: Match }) {
  const team = goal.isHomeTeam ? match.homeTeam : match.awayTeam
  const teamLabel = getTeamDisplayName(team.shortName, team.name)

  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-pitch-900/50 px-3 py-2.5">
      <span className="min-w-[3rem] shrink-0 text-center text-sm font-bold tabular-nums text-emerald-400">
        {goal.minuteLabel}&apos;
      </span>
      <TeamCrest
        crest={team.crest}
        name={team.name}
        isDefined={team.isDefined}
        size="sm"
        className="!h-7 !w-7 sm:!h-8 sm:!w-8"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{goal.playerName}</p>
        <p className="text-xs text-slate-400">
          {teamLabel} · <EventDetailLabel detail={formatMatchGoalDetail(goal.detail, goal.isOwnGoal)} />
        </p>
      </div>
    </li>
  )
}

function MatchGoalsPanelContent({
  match,
  goals,
  expectedGoals,
}: {
  match: Match
  goals: MatchGoal[]
  expectedGoals: number
}) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {match.isLive
          ? 'Nenhum gol registrado até o momento.'
          : 'Detalhes dos gols não disponíveis para esta partida.'}
      </p>
    )
  }

  return (
    <>
      {expectedGoals > goals.length && (
        <p className="mb-3 text-xs text-amber-300/90">
          Mostrando {goals.length} de {expectedGoals} gols. Nem todos os detalhes estão disponíveis no
          momento.
        </p>
      )}
      <ul className="space-y-2">
        {goals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} match={match} />
        ))}
      </ul>
    </>
  )
}

function SubstitutionArrowsIcon() {
  return (
    <span className="flex flex-row items-center gap-0.5" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3 text-emerald-400"
      >
        <path d="m12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3 text-red-400"
      >
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </svg>
    </span>
  )
}

function TimelineIcon({ event }: { event: MatchTimelineEvent }) {
  if (event.kind === 'goal') {
    return <span className="text-sm font-bold text-emerald-400">⚽</span>
  }

  if (event.kind === 'card') {
    const isRed = /red/i.test(event.detail)
    return (
      <span
        className={`inline-block h-5 w-3 shrink-0 ${isRed ? 'bg-red-500' : 'bg-yellow-400'}`}
        aria-hidden="true"
      />
    )
  }

  if (event.kind === 'substitution') {
    return null
  }

  if (event.kind === 'var') {
    return <span className="text-[10px] font-bold uppercase text-purple-400">VAR</span>
  }

  return <span className="text-sm text-slate-500">•</span>
}

function TimelineRow({ event, match }: { event: MatchTimelineEvent; match: Match }) {
  const team = event.isHomeTeam ? match.homeTeam : match.awayTeam
  const teamLabel = getTeamDisplayName(team.shortName, team.name)
  const substitutionDisplay =
    event.kind === 'substitution'
      ? formatSubstitutionTimelineDisplay(event.playerName, event.assistName, teamLabel)
      : null
  const detail = formatTimelineDetail(event)

  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-700/30 bg-pitch-900/40 px-3 py-2.5">
      <span className="min-w-[3rem] shrink-0 text-center text-sm font-bold tabular-nums text-slate-400">
        {event.minuteLabel}&apos;
      </span>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {event.kind === 'substitution' ? (
          <SubstitutionArrowsIcon />
        ) : event.kind === 'goal' ? (
          <TeamCrest
            crest={team.crest}
            name={team.name}
            isDefined={team.isDefined}
            size="sm"
            className="!h-7 !w-7"
          />
        ) : (
          <TimelineIcon event={event} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">
          {substitutionDisplay?.title ?? event.playerName}
        </p>
        <p className="text-xs text-slate-400">
          {substitutionDisplay ? (
            <>
              {substitutionDisplay.teamLabel}
              {substitutionDisplay.playerOut ? (
                <>
                  {' · '}
                  <span className="font-medium text-red-400">Sai:</span> {substitutionDisplay.playerOut}
                </>
              ) : (
                <>
                  {' · '}
                  <EventDetailLabel detail="Substituição" />
                </>
              )}
            </>
          ) : (
            <>
              {teamLabel} · <EventDetailLabel detail={detail} />
            </>
          )}
        </p>
      </div>
    </li>
  )
}

function MatchTimelinePanel({ match, timeline }: { match: Match; timeline: MatchTimelineEvent[] }) {
  if (timeline.length === 0) return null

  return (
    <CollapsiblePanelShell
      title="Histórico"
      panelId="match-history-panel"
      count={timeline.length}
      defaultExpanded={false}
    >
      <ul className="space-y-2">
        {timeline.map((event) => (
          <TimelineRow key={event.id} event={event} match={match} />
        ))}
      </ul>
    </CollapsiblePanelShell>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function LineupColumn({
  title,
  players,
}: {
  title: string
  players: MatchLineupPlayer[]
}) {
  const starters = players.filter((player) => !player.isSubstitute)
  const substitutes = players.filter((player) => player.isSubstitute)

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <ul className="space-y-1.5">
        {starters.map((player) => (
          <LineupRow key={player.id} player={player} />
        ))}
      </ul>
      {substitutes.length > 0 && (
        <>
          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Reservas
          </p>
          <ul className="space-y-1.5">
            {substitutes.map((player) => (
              <LineupRow key={player.id} player={player} muted />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function LineupRow({ player, muted = false }: { player: MatchLineupPlayer; muted?: boolean }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${muted ? 'text-slate-400' : 'text-slate-200'}`}>
      {player.number != null && (
        <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-slate-500">
          {player.number}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
      {player.position && !muted && (
        <span className="hidden shrink-0 text-[11px] text-slate-500 sm:inline">
          {translateLineupPosition(player.position)}
        </span>
      )}
    </li>
  )
}

function MatchLineupsPanel({ match, lineups }: { match: Match; lineups: MatchLineups }) {
  const homeName = getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)
  const awayName = getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)

  return (
    <CollapsiblePanelShell title="Escalações" panelId="match-lineups-panel">
      <div className="grid gap-6 md:grid-cols-2">
        <LineupColumn title={homeName} players={lineups.home} />
        <LineupColumn title={awayName} players={lineups.away} />
      </div>
    </CollapsiblePanelShell>
  )
}

function LoadingSkeleton() {
  return <MatchDetailsSectionSkeleton />
}

function MatchDetailsContent({
  match,
  details,
}: {
  match: Match
  details: MatchDetails
}) {
  const expectedGoals = (match.score.home ?? 0) + (match.score.away ?? 0)

  return (
    <>
      {details.eventInfo && <MatchMetaPanel info={details.eventInfo} />}
      <MatchStatsPanel stats={details.stats} />
      <CollapsiblePanelShell title="Gols" panelId="match-goals-panel">
        <MatchGoalsPanelContent match={match} goals={details.goals} expectedGoals={expectedGoals} />
      </CollapsiblePanelShell>
      <MatchTimelinePanel match={match} timeline={details.timeline} />
      {details.lineups && <MatchLineupsPanel match={match} lineups={details.lineups} />}
    </>
  )
}

export function MatchDetailsSection({ match }: MatchDetailsSectionProps) {
  const { details, isLoading, error } = useMatchDetails(match)
  const showSection = match.isLive || match.status === 'finished'

  if (!showSection) {
    return null
  }

  if (isLoading && !details) {
    return <LoadingSkeleton />
  }

  if (error && !details) {
    return (
      <PanelShell title="Detalhes da partida">
        <p className="text-sm text-slate-500">{error}</p>
      </PanelShell>
    )
  }

  if (!details) {
    return null
  }

  return (
    <>
      <MatchDetailsContent match={match} details={details} />
    </>
  )
}
