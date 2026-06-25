import { Link } from 'react-router-dom'
import type { ApiScorer } from '../../models/api.types'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import {
  getPodiumNameClass,
  getPodiumRankClass,
  getPodiumRowClass,
  isPodiumRank,
} from '../../utils/podiumPlacement'
import { PodiumTrophyIcon } from '../ui/PodiumTrophyIcon'
import { TeamCrest } from '../ui/TeamCrest'

interface ScorersTableProps {
  scorers: ApiScorer[]
}

function ScorerPlayerCell({
  playerName,
  teamName,
  teamId,
  crest,
  rank,
}: {
  playerName: string
  teamName: string
  teamId: number | null | undefined
  crest: string | null | undefined
  rank: number
}) {
  const isPodium = isPodiumRank(rank)
  const content = (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      {isPodium && <PodiumTrophyIcon rank={rank} />}
      <span className="truncate" title={playerName}>
        {playerName}
      </span>
      <TeamCrest
        crest={crest}
        name={teamName}
        size="sm"
        className="!h-4 !w-4 shrink-0 sm:!h-5 sm:!w-5"
      />
    </span>
  )

  if (teamId != null) {
    return (
      <Link
        to={`/times/${teamId}`}
        className={`inline-flex min-w-0 max-w-full items-center transition hover:text-gold-400 ${getPodiumNameClass(rank)}`}
        title={`${playerName} · ${teamName}`}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={`inline-flex min-w-0 max-w-full items-center ${getPodiumNameClass(rank)}`} title={playerName}>
      {content}
    </div>
  )
}

export function ScorersTable({ scorers }: ScorersTableProps) {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
      <table className="w-full border-collapse table-fixed text-left text-xs sm:text-sm">
        <colgroup>
          <col style={{ width: '2.5rem' }} />
          <col />
          <col style={{ width: '4.5rem' }} />
        </colgroup>
        <thead>
          <tr className="bg-pitch-900/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
            <th className="px-3 py-2.5 text-left">#</th>
            <th className="border-b border-slate-700/40 px-3 py-2.5 text-left">Jogador</th>
            <th className="px-2 py-2.5 pr-4 text-center">Gols</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((scorer, index) => {
            const playerName = scorer.player.name?.trim() || 'Jogador'
            const teamName = getTeamDisplayName(scorer.team.shortName, scorer.team.name)
            const teamId = scorer.team.id
            const goals = scorer.goals ?? 0
            const rank = index + 1
            const isPodium = isPodiumRank(rank)
            const isLastRow = index === scorers.length - 1
            const rowDivider = isLastRow ? '' : 'border-b border-slate-700/20'

            return (
              <tr
                key={`${scorer.player.id ?? playerName}-${teamId ?? teamName}`}
                className={getPodiumRowClass(rank)}
              >
                <td
                  className={`px-3 py-2.5 text-left font-bold tabular-nums ${getPodiumRankClass(rank)}`}
                >
                  {rank}
                </td>
                <td
                  className={`max-w-0 overflow-hidden px-3 py-2.5 text-left font-semibold ${rowDivider}`}
                >
                  <ScorerPlayerCell
                    playerName={playerName}
                    teamName={teamName}
                    teamId={teamId}
                    crest={scorer.team.crest}
                    rank={rank}
                  />
                </td>
                <td
                  className={`px-2 py-2.5 pr-4 text-center text-sm font-bold tabular-nums sm:text-base ${
                    isPodium ? getPodiumRankClass(rank) : 'text-gold-400'
                  }`}
                >
                  {goals}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
