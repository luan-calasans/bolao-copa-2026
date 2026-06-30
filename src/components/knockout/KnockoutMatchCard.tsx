import { Link } from 'react-router-dom'
import type { KnockoutMatch } from '../../models/knockout'
import type { KnockoutSimulatorProps } from '../../utils/knockoutSimulator'
import { formatMatchDate, formatMatchTime } from '../../utils/dateFormatter'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'
import { ScoreInput } from '../bet/ScoreInput'
import { ClearFiltersButton } from '../ui/ClearFiltersButton'
import { matchBetsPath } from '../../routes/routePaths'
import { isKnockoutMatchPlayable, isKnockoutMatchDefined } from './knockoutBracketLayout'
import { isTeamDefined } from '../../utils/teamDisplay'
import type { Team } from '../../models/team'

interface KnockoutMatchCardProps {
  match: KnockoutMatch
  index: number
  linkTeams?: boolean
  simulator?: KnockoutSimulatorProps
}

function ParticipantRow({
  participant,
  goals,
  isWinner,
  linkTeams = true,
  onPick,
  isPickable = false,
}: {
  participant: KnockoutMatch['home']
  goals: number | null
  isWinner: boolean
  linkTeams?: boolean
  onPick?: () => void
  isPickable?: boolean
}) {
  const name = participant.team
    ? getTeamDisplayName(participant.team.shortName, participant.team.name)
    : participant.label

  const content = (
    <>
      <TeamCrest
        crest={participant.team?.crest ?? null}
        name={name}
        isDefined={Boolean(participant.team)}
        size="sm"
        className={`!h-7 !w-7 shrink-0 rounded-lg bg-pitch-900/50 p-0.5 ${
          isPickable ? 'cursor-pointer' : ''
        }`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            isWinner ? 'text-gold-400' : participant.team ? 'text-white' : 'text-slate-400'
          }`}
        >
          {name}
        </p>
        {participant.isProjected && participant.team && (
          <p className="text-[10px] text-slate-500">Projeção</p>
        )}
      </div>
      {goals != null && (
        <span className="shrink-0 text-lg font-black tabular-nums text-white">{goals}</span>
      )}
    </>
  )

  if (isPickable) {
    return (
      <button
        type="button"
        onClick={onPick}
        className={`flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-pitch-700/40 ${
          isWinner ? 'bg-brazil-green/10 ring-1 ring-brazil-green/30' : ''
        }`}
      >
        {content}
      </button>
    )
  }

  if (linkTeams && participant.team?.id) {
    return (
      <Link
        to={`/times/${participant.team.id}`}
        className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition hover:bg-pitch-700/40"
      >
        {content}
      </Link>
    )
  }

  return <div className="flex items-center gap-2.5 px-1 py-1">{content}</div>
}

function resolveKnockoutWinner(
  match: KnockoutMatch,
  showScore: boolean,
): { homeWins: boolean; awayWins: boolean } {
  if (!showScore || match.score.home == null || match.score.away == null) {
    return { homeWins: false, awayWins: false }
  }

  const { home, away } = match.score

  if (home !== away) {
    return { homeWins: home > away, awayWins: away > home }
  }

  const etHome = match.extraTime?.home
  const etAway = match.extraTime?.away

  if (etHome != null && etAway != null) {
    const totalHome = home + etHome
    const totalAway = away + etAway

    if (totalHome !== totalAway) {
      return {
        homeWins: totalHome > totalAway,
        awayWins: totalAway > totalHome,
      }
    }
  }

  const penHome = match.penalties?.home
  const penAway = match.penalties?.away

  if (penHome != null && penAway != null && penHome !== penAway) {
    return { homeWins: penHome > penAway, awayWins: penAway > penHome }
  }

  return { homeWins: false, awayWins: false }
}

function participantToTeam(participant: KnockoutMatch['home']): Team {
  if (participant.team && isTeamDefined(participant.team)) {
    return participant.team
  }

  return {
    id: null,
    name: participant.label,
    shortName: '',
    tla: '',
    crest: '',
    isDefined: false,
  }
}

function isRealResultLocked(
  match: KnockoutMatch,
  simulator: KnockoutSimulatorProps,
  userScore?: { home: number | null; away: number | null },
): boolean {
  const hasFullUserScore = userScore != null && userScore.home != null && userScore.away != null

  return (
    (match.status === 'finished' || match.status === 'live') &&
    match.score.home != null &&
    match.score.away != null &&
    simulator.picks[match.key] == null &&
    !hasFullUserScore
  )
}

function isRealFinishedResult(
  match: KnockoutMatch,
  simulator?: KnockoutSimulatorProps,
  userScore?: { home: number | null; away: number | null },
): boolean {
  const hasFullUserScore = userScore != null && userScore.home != null && userScore.away != null

  return (
    match.status === 'finished' &&
    match.score.home != null &&
    match.score.away != null &&
    (!simulator || (simulator.picks[match.key] == null && !hasFullUserScore))
  )
}

function SimulatorMatchStatus({
  isLive,
  isFinished,
  isUndefined,
}: {
  isLive: boolean
  isFinished: boolean
  isUndefined: boolean
}) {
  if (!isLive && !isFinished && !isUndefined) return null

  return (
    <div className="mt-3 flex justify-center">
      {isLive ? (
        <span className="rounded-md border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
          Ao vivo
        </span>
      ) : isFinished ? (
        <span className="rounded-md border border-red-400/50 bg-red-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-300">
          Finalizado
        </span>
      ) : (
        <span className="rounded-md border border-slate-500/50 bg-slate-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-300">
          A definir
        </span>
      )}
    </div>
  )
}

function SimulatorScoreInputs({
  match,
  simulator,
  isFinished,
  isUndefined,
}: {
  match: KnockoutMatch
  simulator: KnockoutSimulatorProps
  isFinished: boolean
  isUndefined: boolean
}) {
  const userScore = simulator.scores[match.key]
  const homeTeam = participantToTeam(match.home)
  const awayTeam = participantToTeam(match.away)
  const bothTeamsDefined = isKnockoutMatchDefined(match)
  const hasAnyUserScore = userScore != null && (userScore.home != null || userScore.away != null)
  const isLocked = !bothTeamsDefined || isRealResultLocked(match, simulator, userScore)
  const canEditScores = bothTeamsDefined && !isRealResultLocked(match, simulator, userScore)
  const winner = bothTeamsDefined ? simulator.getWinner(match) : null

  const displayHome =
    userScore?.home != null
      ? userScore.home
      : isLocked && match.score.home != null
        ? match.score.home
        : null
  const displayAway =
    userScore?.away != null
      ? userScore.away
      : isLocked && match.score.away != null
        ? match.score.away
        : null

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreInput
          value={displayHome}
          onChange={(value) => simulator.onScoreChange(match.key, value, userScore?.away ?? null)}
          team={homeTeam}
          compact
          readOnly={isLocked}
          isWinner={winner === match.home}
        />
        <ScoreInput
          value={displayAway}
          onChange={(value) => simulator.onScoreChange(match.key, userScore?.home ?? null, value)}
          team={awayTeam}
          compact
          readOnly={isLocked}
          isWinner={winner === match.away}
        />
      </div>

      <SimulatorMatchStatus
        isLive={match.status === 'live'}
        isFinished={isFinished}
        isUndefined={isUndefined}
      />

      {canEditScores && hasAnyUserScore && (
        <ClearFiltersButton
          label="Limpar placar"
          onClick={() => simulator.onScoreChange(match.key, null, null)}
        />
      )}
    </div>
  )
}

export function KnockoutMatchCard({
  match,
  index,
  linkTeams = true,
  simulator,
}: KnockoutMatchCardProps) {
  const userScore = simulator?.scores[match.key]
  const hasUserScore = userScore != null && userScore.home != null && userScore.away != null
  const isRealApiResult =
    match.status === 'finished' &&
    match.score.home != null &&
    match.score.away != null &&
    !simulator?.picks[match.key] &&
    !hasUserScore
  const hasScore = hasUserScore || isRealApiResult
  const showScore =
    hasScore && (match.status === 'finished' || match.status === 'live' || hasUserScore)
  const displayHome = hasUserScore ? userScore!.home : isRealApiResult ? match.score.home : null
  const displayAway = hasUserScore ? userScore!.away : isRealApiResult ? match.score.away : null
  const { homeWins, awayWins } = resolveKnockoutWinner(
    hasUserScore
      ? { ...match, status: 'finished', score: { home: userScore!.home, away: userScore!.away } }
      : match,
    showScore,
  )
  const showPenalties =
    showScore &&
    match.score.home != null &&
    match.score.away != null &&
    match.score.home === match.score.away &&
    match.penalties?.home != null &&
    match.penalties?.away != null
  const showExtraTime =
    showScore &&
    match.score.home != null &&
    match.score.away != null &&
    match.score.home === match.score.away &&
    match.extraTime?.home != null &&
    match.extraTime?.away != null
  const bothTeamsDefined = isKnockoutMatchPlayable(match)
  const isFinished = isRealFinishedResult(match, simulator, userScore)
  const isUndefined = Boolean(simulator) && !isKnockoutMatchDefined(match)

  return (
    <article
      className={`rounded-2xl border bg-pitch-800/60 p-3 sm:p-4 ${
        match.status === 'live'
          ? 'border-brazil-green/50 shadow-sm shadow-brazil-green/10'
          : isFinished
            ? 'border-red-400/40 bg-red-500/5 shadow-sm shadow-red-500/10'
            : isUndefined
              ? 'border-slate-500/40 bg-slate-500/5'
              : 'border-slate-700/40'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Jogo {index + 1}
          {match.isProjected && !match.id ? ' · Projeção' : ''}
        </span>
        {match.utcDate && (
          <span className="text-[10px] text-slate-500">
            {formatMatchDate(match.utcDate)} · {formatMatchTime(match.utcDate)}
          </span>
        )}
      </div>

      {!simulator && (
        <div className="space-y-2">
          <ParticipantRow
            participant={match.home}
            goals={showScore ? displayHome : null}
            isWinner={homeWins}
            linkTeams={linkTeams}
          />
          <ParticipantRow
            participant={match.away}
            goals={showScore ? displayAway : null}
            isWinner={awayWins}
            linkTeams={linkTeams}
          />
        </div>
      )}

      {showPenalties && (
        <p className="mt-2 text-center text-[10px] font-medium text-slate-400">
          Pênaltis: {match.penalties?.home}×{match.penalties?.away}
        </p>
      )}

      {showExtraTime && (
        <p className="mt-2 text-center text-[10px] font-medium text-slate-400">
          Prorrogação: {match.extraTime?.home}×{match.extraTime?.away}
        </p>
      )}

      {match.status === 'live' && !simulator && (
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
          Ao vivo
        </p>
      )}

      {simulator && (
        <SimulatorScoreInputs
          match={match}
          simulator={simulator}
          isFinished={isFinished}
          isUndefined={isUndefined}
        />
      )}

      {bothTeamsDefined && !simulator && (
        <div className="mt-3 border-t border-slate-700/30 pt-3">
          <Link
            to={matchBetsPath(match.id!)}
            className="block text-center text-xs font-semibold text-gold-400 transition hover:text-gold-300"
          >
            Ver jogo e palpites
          </Link>
        </div>
      )}
    </article>
  )
}
