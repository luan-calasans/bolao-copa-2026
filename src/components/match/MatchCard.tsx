import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Match } from '../../models/match'
import { formatMatchCardDate, formatMatchCardMeta, formatStage } from '../../utils/dateFormatter'
import { canPlaceBet } from '../../utils/matchStatus'
import {
  getTeamOutcome,
  getTeamOutcomeClasses,
  shouldShowMatchOutcome,
} from '../../utils/matchOutcome'
import { getTeamDisplayName, hasValidVenue, areMatchTeamsDefined } from '../../utils/teamDisplay'
import { Button } from '../ui/Button'
import { TeamIdentity } from '../ui/TeamIdentity'
import { MatchStatusBadge } from './MatchStatusBadge'
import { MatchYouTubeHighlightsButton } from './MatchYouTubeHighlightsButton'

interface MatchCardProps {
  match: Match
  showBetAction?: boolean
  prioritizeCrests?: boolean
  showScheduledStatusBadge?: boolean
  centerTeamColumns?: boolean
  stackActionButtons?: boolean
}

export function MatchCard({
  match,
  showBetAction = true,
  prioritizeCrests = false,
  showScheduledStatusBadge = true,
  centerTeamColumns = true,
  stackActionButtons = false,
}: MatchCardProps) {
  const canBet = canPlaceBet(match)
  const teamsDefined = areMatchTeamsDefined(match)
  const showActions = showBetAction && teamsDefined
  const { home, away } = match.score
  const hasScore = home !== null && away !== null
  const showOutcome = shouldShowMatchOutcome(match.status, home, away)
  const homeOutcome = showOutcome && hasScore ? getTeamOutcome(home, away, 'home') : null
  const awayOutcome = showOutcome && hasScore ? getTeamOutcome(home, away, 'away') : null
  const showStatusBadge =
    !match.isLive &&
    (match.status === 'finished' ||
      match.status === 'postponed' ||
      match.status === 'cancelled' ||
      (showScheduledStatusBadge && teamsDefined && match.status === 'scheduled'))
  const hasFooter = hasValidVenue(match.venue) || showStatusBadge
  const homeName = getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)
  const awayName = getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)
  const matchHref = `/jogo/${match.id}/palpites`
  const secondaryActionLabel = match.status === 'finished' ? 'Saiba mais' : 'Palpites'

  const crestLoading = prioritizeCrests ? 'eager' : 'lazy'
  const crestFetchPriority = prioritizeCrests ? 'high' : 'low'
  const homeAlign = centerTeamColumns ? 'center' : 'left'
  const awayAlign = centerTeamColumns ? 'center' : 'right'
  const actionItemClass = stackActionButtons ? 'w-full' : 'min-w-0 flex-1'

  return (
    <article
      className={`group relative flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border bg-pitch-800/80 shadow-lg transition-all hover:shadow-xl ${
        match.isLive
          ? 'border-brazil-green/50 shadow-brazil-green/10'
          : 'border-slate-700/40 hover:border-brazil-yellow/20'
      }`}
    >
      {teamsDefined && (
        <Link
          to={matchHref}
          className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500/60"
          aria-label={`Ver ${homeName} x ${awayName}`}
        />
      )}

      <div className="card-header-bar pointer-events-none relative z-[1] flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-t-2xl px-3 py-2.5 sm:px-4">
        <span className="shrink-0 rounded-lg bg-blue-900/50 px-2 py-1 text-[10px] font-medium text-blue-100 sm:px-3 sm:text-xs">
          {formatMatchCardDate(match.utcDate)}
        </span>
        <span className="min-w-0 truncate text-right text-[10px] font-medium text-slate-200 sm:text-xs">
          {formatMatchCardMeta(match.utcDate, match.group)}
        </span>
      </div>

      <div className="pointer-events-none relative z-[1] flex min-w-0 flex-col overflow-hidden rounded-b-2xl p-3 sm:p-5">
        <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {formatStage(match.stage)}
        </p>

        <div className="mb-3 flex min-w-0 items-start justify-between gap-1 sm:gap-2">
          <TeamOutcomeFrame outcome={homeOutcome} className="min-w-0 flex-1">
            <TeamIdentity
              team={match.homeTeam}
              align={homeAlign}
              className="min-w-0 w-full"
              nameClassName="w-full truncate text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs"
              crestClassName="rounded-xl p-1"
              crestLoading={crestLoading}
              crestFetchPriority={crestFetchPriority}
            />
          </TeamOutcomeFrame>
          <div className="mt-5 flex shrink-0 items-center gap-1 sm:mt-6 sm:gap-2">
            <ScoreBox value={hasScore ? home : null} />
            <span className="text-base font-bold text-slate-500 sm:text-lg">X</span>
            <ScoreBox value={hasScore ? away : null} />
          </div>
          <TeamOutcomeFrame outcome={awayOutcome} className="min-w-0 flex-1">
            <TeamIdentity
              team={match.awayTeam}
              align={awayAlign}
              className="min-w-0 w-full"
              nameClassName="w-full truncate text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs"
              crestClassName="rounded-xl p-1"
              crestLoading={crestLoading}
              crestFetchPriority={crestFetchPriority}
            />
          </TeamOutcomeFrame>
        </div>

        {hasFooter && (
          <div className="mt-4">
            {hasValidVenue(match.venue) && (
              <p className="mb-2 truncate text-center text-[11px] text-slate-400 sm:text-xs">
                {match.venue}
              </p>
            )}
            {showStatusBadge && (
              <div className="flex justify-center">
                <MatchStatusBadge
                  rawStatus={match.rawStatus}
                  minute={match.minute}
                  isLive={match.isLive}
                  variant="corner"
                />
              </div>
            )}
          </div>
        )}

        {showActions && (
          <div className="pointer-events-auto relative z-[2] mt-4 flex flex-col gap-2">
            <div
              className={`flex gap-2 ${stackActionButtons ? 'flex-col' : 'items-center'}`}
            >
              <Link to={matchHref} className={`${actionItemClass} cursor-pointer`}>
                <Button variant="secondary" className="w-full py-2.5 text-xs sm:text-sm">
                  {secondaryActionLabel}
                </Button>
              </Link>

              {match.status === 'finished' && (
                <MatchYouTubeHighlightsButton
                  match={match}
                  className={actionItemClass}
                  shortFinishedLabel
                />
              )}

              {canBet && (
                <Link to={`/palpite/${match.id}`} className={`${actionItemClass} cursor-pointer`}>
                  <Button variant="gold" className="w-full py-2.5 text-xs sm:text-sm">
                    Palpitar
                  </Button>
                </Link>
              )}
            </div>

            {match.isLive && <MatchYouTubeHighlightsButton match={match} />}
          </div>
        )}
      </div>
    </article>
  )
}

function TeamOutcomeFrame({
  outcome,
  className = '',
  children,
}: {
  outcome: ReturnType<typeof getTeamOutcome> | null
  className?: string
  children: ReactNode
}) {
  if (!outcome) {
    return <div className={`min-w-0 ${className}`}>{children}</div>
  }

  return <div className={`min-w-0 ${getTeamOutcomeClasses(outcome)} ${className}`}>{children}</div>
}

function ScoreBox({ value }: { value: number | null }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-600/60 bg-pitch-950 text-sm font-bold tabular-nums text-slate-300">
      {value ?? '-'}
    </div>
  )
}
