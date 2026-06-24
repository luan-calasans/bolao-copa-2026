import type { Match } from '../../models/match'
import type { WinnerPick } from '../../models/winnerPick'
import { hasBetScorePick } from '../../utils/betValidation'
import { getBetOutcome } from '../../utils/betResult'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { formatWinnerPickLabel, getWinnerPickTextClass } from '../../utils/winnerPickDisplay'
import { isValidWinnerPick } from '../../utils/winnerPickValidation'
import { TeamCrest } from '../ui/TeamCrest'

interface BetScoreWithOutcomeProps {
  homeScore?: number | null
  awayScore?: number | null
  winnerPick?: WinnerPick | null
  match?: Match | null
  showBetOutcome?: boolean
  align?: 'start' | 'center'
  layout?: 'stack' | 'inline'
  comfortable?: boolean
  compact?: boolean
}

export function BetScoreWithOutcome({
  homeScore,
  awayScore,
  winnerPick,
  match,
  showBetOutcome = false,
  align = 'start',
  layout = 'stack',
  comfortable = false,
  compact = false,
}: BetScoreWithOutcomeProps) {
  const hasScore = hasBetScorePick(homeScore, awayScore)
  const outcome =
    showBetOutcome && match && hasScore
      ? getBetOutcome(match, homeScore as number, awayScore as number)
      : null
  const alignClass = align === 'center' ? 'items-center' : 'items-start'
  const layoutClass =
    layout === 'inline'
      ? `min-w-0 max-w-full flex-row items-center ${compact ? 'gap-1.5' : 'gap-3'}`
      : `min-w-0 max-w-full flex-col ${compact ? 'gap-1' : 'gap-2'} ${alignClass}`

  const scoreBadgeClass = compact
    ? 'px-2 py-0.5 text-sm'
    : comfortable
      ? 'text-lg px-3 py-1.5'
      : 'text-base px-3 py-1.5'

  if (!hasScore) {
    if (match && winnerPick && isValidWinnerPick(winnerPick)) {
      const winnerLabel = formatWinnerPickLabel(match, winnerPick)

      return (
        <div className={`inline-flex ${layoutClass}`}>
          <span
            className={`inline-flex max-w-full min-w-0 truncate rounded-lg border border-slate-600/50 bg-pitch-950 font-semibold ${scoreBadgeClass} ${getWinnerPickTextClass(winnerPick)} ${comfortable && !compact ? 'text-base' : ''}`}
            title={winnerLabel}
          >
            {winnerLabel}
          </span>
        </div>
      )
    }

    return <span className={`text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>Sem placar</span>
  }

  const winnerLabel =
    match && winnerPick && isValidWinnerPick(winnerPick)
      ? formatWinnerPickLabel(match, winnerPick)
      : null

  return (
    <div className={`inline-flex ${layoutClass}`}>
      <span
        className={`inline-flex shrink-0 rounded-lg border border-slate-600/50 bg-pitch-950 font-bold tabular-nums text-gold-400 ${scoreBadgeClass}`}
      >
        {homeScore} x {awayScore}
      </span>

      {outcome?.type === 'win' && (
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-400">
          <span>Vitória</span>
          <TeamCrest
            crest={outcome.team.crest}
            name={getTeamDisplayName(outcome.team.shortName, outcome.team.name)}
            isDefined={outcome.team.isDefined}
            size="sm"
            className="!h-6 !w-6 rounded-md bg-pitch-900/50 p-0.5 sm:!h-7 sm:!w-7"
          />
        </span>
      )}

      {outcome?.type === 'draw' && (
        <span className="shrink-0 text-sm font-semibold text-slate-400">Empate</span>
      )}

      {winnerLabel && (
        <span
          className={`min-w-0 truncate font-semibold ${compact ? 'text-xs' : 'text-sm'} ${getWinnerPickTextClass(winnerPick!)}`}
          title={winnerLabel}
        >
          {winnerLabel}
        </span>
      )}
    </div>
  )
}
