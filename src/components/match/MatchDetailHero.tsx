import { Link } from 'react-router-dom'
import type { Match } from '../../models/match'
import {
  formatGroup,
  formatMatchDate,
  formatMatchTime,
  formatRelativeTime,
  formatStage,
} from '../../utils/dateFormatter'
import { formatScoreDisplay } from '../../utils/matchMapper'
import { areMatchTeamsDefined, getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamIdentity } from '../ui/TeamIdentity'
import { MatchStatusBadge } from './MatchStatusBadge'

interface MatchDetailHeroProps {
  match: Match
  betCount?: number
  exactCount?: number
  partialCount?: number
  isFinished?: boolean
}

function formatScoredSummary(exactCount: number, partialCount: number): string {
  const parts: string[] = []

  if (exactCount > 0) {
    parts.push(`${exactCount} exato${exactCount === 1 ? '' : 's'}`)
  }

  if (partialCount > 0) {
    parts.push(`${partialCount} parcial${partialCount === 1 ? '' : 'is'}`)
  }

  return parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
}

export function MatchDetailHero({
  match,
  betCount,
  exactCount,
  partialCount,
  isFinished = false,
}: MatchDetailHeroProps) {
  const { home, away } = match.score
  const hasScore = home !== null && away !== null
  const showScore = hasScore && (match.isLive || match.status === 'finished')
  const showHalfTime =
    match.halfTimeScore.home !== null &&
    match.halfTimeScore.away !== null &&
    (match.isLive || match.status === 'finished')
  const relativeKickoff = formatRelativeTime(match.utcDate)
  const groupLabel = formatGroup(match.group)
  const teamsDefined = areMatchTeamsDefined(match)
  const showStatusBadge =
    match.isLive ||
    match.status === 'finished' ||
    match.status === 'postponed' ||
    match.status === 'cancelled' ||
    (teamsDefined && match.status === 'scheduled')

  return (
    <div
      className={`rounded-2xl border bg-pitch-800/40 p-4 sm:p-6 ${
        match.isLive
          ? 'border-brazil-green/50 shadow-lg shadow-brazil-green/10'
          : 'border-slate-700/50'
      }`}
    >
      <div
        className={`mb-5 flex flex-wrap items-center gap-2 ${
          showStatusBadge ? 'justify-between' : 'justify-end'
        }`}
      >
        {showStatusBadge && (
          <MatchStatusBadge
            rawStatus={match.rawStatus}
            minute={match.minute}
            isLive={match.isLive}
            variant="pill"
          />
        )}
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {formatStage(match.stage)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 sm:gap-6">
        <TeamLink team={match.homeTeam} align="left" />
        <div className="shrink-0 text-center">
          {showScore ? (
            <>
              {match.isLive && (
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Placar atual
                </p>
              )}
              <p className="text-3xl font-black tabular-nums text-white sm:text-4xl">
                {formatScoreDisplay(match)}
              </p>
              {showHalfTime && (
                <p className="mt-1 text-xs text-slate-400">
                  Intervalo {match.halfTimeScore.home} × {match.halfTimeScore.away}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-bold text-slate-500 sm:text-xl">×</p>
          )}
          {betCount !== undefined && (
            <p className="mt-2 text-xs text-slate-500">
              {betCount} palpite{betCount === 1 ? '' : 's'}
              {isFinished &&
                exactCount !== undefined &&
                partialCount !== undefined &&
                formatScoredSummary(exactCount, partialCount)}
            </p>
          )}
        </div>
        <TeamLink team={match.awayTeam} align="right" />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-700/40 pt-5 text-sm">
        <DetailItem label="Data" value={formatMatchDate(match.utcDate)} />
        <DetailItem label="Horário" value={formatMatchTime(match.utcDate)} />
        {relativeKickoff && match.status === 'scheduled' && (
          <DetailItem label="Início" value={relativeKickoff} />
        )}
        {groupLabel && <DetailItem label="Grupo" value={groupLabel} />}
        {match.matchday != null && <DetailItem label="Rodada" value={String(match.matchday)} />}
        {match.venue?.trim() && (
          <DetailItem label="Local" value={match.venue} className="col-span-2" />
        )}
      </dl>
    </div>
  )
}

function DetailItem({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-200">{value}</dd>
    </div>
  )
}

function TeamLink({ team, align }: { team: Match['homeTeam']; align: 'left' | 'right' }) {
  const name = getTeamDisplayName(team.shortName, team.name)
  const identity = (
    <TeamIdentity
      team={team}
      align={align}
      size="lg"
      nameClassName="text-sm font-bold text-white sm:text-base"
      crestLoading="eager"
      crestFetchPriority="high"
    />
  )

  if (team.id) {
    return (
      <Link
        to={`/times/${team.id}`}
        className="min-w-0 flex-1 transition hover:opacity-80"
        title={`Ver ${name}`}
      >
        {identity}
      </Link>
    )
  }

  return <div className="min-w-0 flex-1">{identity}</div>
}
