import { Link } from 'react-router-dom'
import type { ApiTeamDetail } from '../../models/api.types'
import type { Match } from '../../models/match'
import { formatMatchCardDate } from '../../utils/dateFormatter'
import { getTeamDisplayName, isTeamDefined } from '../../utils/teamDisplay'
import { MatchStatusBadge } from '../match/MatchStatusBadge'
import { TeamCrest } from '../ui/TeamCrest'

const CHAMPION_PICK_COLOR = '#00d492'

export function ChampionBetMatchPlaceholder({ comfortable = false }: { comfortable?: boolean }) {
  const textClass = comfortable ? 'text-sm text-slate-500' : 'text-xs text-slate-500'

  return (
    <span className={textClass} aria-label="Palpite de campeão">
      —
    </span>
  )
}

export function MatchMetaInfo({
  match,
  comfortable = false,
}: {
  match: Match
  comfortable?: boolean
}) {
  const dateClass = comfortable ? 'text-sm text-slate-400' : 'text-xs text-slate-400'

  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <MatchStatusBadge
        rawStatus={match.rawStatus}
        minute={match.minute}
        isLive={match.isLive}
        variant="pill"
        size={comfortable ? 'md' : 'sm'}
      />
      <span className={dateClass}>{formatMatchCardDate(match.utcDate)}</span>
    </div>
  )
}

export function CompactMatchTeams({
  match,
  matchId,
  comfortable = false,
  display = 'names',
}: {
  match: Match
  matchId?: number
  comfortable?: boolean
  display?: 'names' | 'crests'
}) {
  const homeName = getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)
  const awayName = getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)
  const matchupLabel = `${homeName} x ${awayName}`
  const textClass = comfortable ? 'text-sm' : 'text-xs'
  const crestClass = comfortable ? '!h-7 !w-7 shrink-0' : '!h-6 !w-6 shrink-0'

  const content =
    display === 'crests' ? (
      <div className="flex items-center justify-center gap-2">
        <TeamCrest
          crest={match.homeTeam.crest}
          name={match.homeTeam.name}
          isDefined={isTeamDefined(match.homeTeam)}
          size="sm"
          className={crestClass}
        />
        <span className={`shrink-0 font-semibold text-slate-500 ${textClass}`}>x</span>
        <TeamCrest
          crest={match.awayTeam.crest}
          name={match.awayTeam.name}
          isDefined={isTeamDefined(match.awayTeam)}
          size="sm"
          className={crestClass}
        />
      </div>
    ) : (
      <div className="flex min-w-0 max-w-full items-center gap-1.5">
        <TeamCrest
          crest={match.homeTeam.crest}
          name={match.homeTeam.name}
          size="sm"
          className={crestClass}
        />
        <span
          className={`min-w-0 flex-1 truncate font-semibold text-white ${textClass}`}
          title={matchupLabel}
        >
          {matchupLabel}
        </span>
        <TeamCrest
          crest={match.awayTeam.crest}
          name={match.awayTeam.name}
          size="sm"
          className={crestClass}
        />
      </div>
    )

  if (matchId) {
    return (
      <Link
        to={`/jogo/${matchId}/palpites`}
        className="min-w-0 transition hover:opacity-80"
        title={display === 'crests' ? matchupLabel : 'Palpites do jogo'}
      >
        {content}
      </Link>
    )
  }

  return content
}

export function ChampionBetCategoryLabel({
  team,
  comfortable = false,
}: {
  team?: ApiTeamDetail
  comfortable?: boolean
}) {
  if (team) {
    return <ChampionBetPickDisplay team={team} comfortable={comfortable} />
  }

  const textClass = comfortable ? 'text-sm font-semibold' : 'text-xs font-semibold'

  return (
    <span className={textClass} style={{ color: CHAMPION_PICK_COLOR }}>
      Campeão
    </span>
  )
}

export function ChampionBetPickDisplay({
  team,
  comfortable = false,
}: {
  team: ApiTeamDetail
  comfortable?: boolean
}) {
  const teamName = getTeamDisplayName(team.shortName, team.name)
  const textClass = comfortable ? 'text-sm font-semibold' : 'text-xs font-semibold'
  const crestClass = comfortable ? '!h-7 !w-7 shrink-0' : '!h-6 !w-6 shrink-0'

  return (
    <div className="flex min-w-0 items-center justify-center gap-2">
      <TeamCrest crest={team.crest} name={teamName} size="sm" className={crestClass} />
      <span
        className={`min-w-0 truncate ${textClass}`}
        style={{ color: CHAMPION_PICK_COLOR }}
        title={teamName}
      >
        Campeão
      </span>
    </div>
  )
}
