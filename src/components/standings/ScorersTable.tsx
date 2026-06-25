import { Link } from 'react-router-dom'
import type { ApiScorer } from '../../models/api.types'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface ScorersTableProps {
  scorers: ApiScorer[]
}

function ScorerPlayerCell({
  playerName,
  teamName,
  teamId,
  crest,
}: {
  playerName: string
  teamName: string
  teamId: number | null | undefined
  crest: string | null | undefined
}) {
  const content = (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2">
      <span className="truncate text-white" title={playerName}>
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
        className="inline-flex min-w-0 max-w-full items-center transition hover:text-gold-400"
        title={`${playerName} · ${teamName}`}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="inline-flex min-w-0 max-w-full items-center text-white" title={playerName}>
      {content}
    </div>
  )
}

export function ScorersTable({ scorers }: ScorersTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
      <div className="border-b border-slate-700/40 bg-pitch-900/60 px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Goleadores</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700/40">
            <th className="w-px whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              #
            </th>
            <th className="w-full px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Jogador
            </th>
            <th className="w-px whitespace-nowrap px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Gols
            </th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((scorer, index) => {
            const playerName = scorer.player.name?.trim() || 'Jogador'
            const teamName = getTeamDisplayName(scorer.team.shortName, scorer.team.name)
            const teamId = scorer.team.id
            const goals = scorer.goals ?? 0
            const rank = index + 1

            return (
              <tr
                key={`${scorer.player.id ?? playerName}-${teamId ?? teamName}`}
                className="border-b border-slate-700/20 last:border-b-0"
              >
                <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums text-slate-300">
                  {rank}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">
                  <ScorerPlayerCell
                    playerName={playerName}
                    teamName={teamName}
                    teamId={teamId}
                    crest={scorer.team.crest}
                  />
                </td>
                <td className="w-px whitespace-nowrap px-3 py-3 text-center text-base tabular-nums text-lg font-bold text-gold-400">
                  <span className="inline-block min-w-[1.25rem] rounded-lg px-2 py-1 tabular-nums">
                    {goals}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
