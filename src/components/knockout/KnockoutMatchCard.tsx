import { Link } from 'react-router-dom'
import type { KnockoutMatch } from '../../models/knockout'
import { formatMatchDate, formatMatchTime } from '../../utils/dateFormatter'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'
import { matchBetsPath } from '../../routes/routePaths'
import { isKnockoutMatchPlayable } from './knockoutBracketLayout'

interface KnockoutMatchCardProps {
  match: KnockoutMatch
  index: number
}

function ParticipantRow({
  participant,
  goals,
  isWinner,
}: {
  participant: KnockoutMatch['home']
  goals: number | null
  isWinner: boolean
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
        className="!h-7 !w-7 shrink-0 rounded-lg bg-pitch-900/50 p-0.5"
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

  if (participant.team?.id) {
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

export function KnockoutMatchCard({ match, index }: KnockoutMatchCardProps) {
  const hasScore = match.score.home != null && match.score.away != null
  const showScore = hasScore && (match.status === 'finished' || match.status === 'live')
  const homeWins =
    showScore && match.score.home != null && match.score.away != null
      ? match.score.home > match.score.away
      : false
  const awayWins =
    showScore && match.score.home != null && match.score.away != null
      ? match.score.away > match.score.home
      : false
  const bothTeamsDefined = isKnockoutMatchPlayable(match)

  return (
    <article
      className={`rounded-2xl border bg-pitch-800/60 p-3 sm:p-4 ${
        match.status === 'live'
          ? 'border-brazil-green/50 shadow-sm shadow-brazil-green/10'
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

      <div className="space-y-2">
        <ParticipantRow participant={match.home} goals={showScore ? match.score.home : null} isWinner={homeWins} />
        <ParticipantRow participant={match.away} goals={showScore ? match.score.away : null} isWinner={awayWins} />
      </div>

      {match.status === 'live' && (
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
          Ao vivo
        </p>
      )}

      {bothTeamsDefined && (
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
