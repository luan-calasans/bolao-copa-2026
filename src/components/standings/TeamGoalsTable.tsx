import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TeamGoalsEntry } from '../../utils/teamGoalsFromMatches'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { Button } from '../ui/Button'
import { TeamCrest } from '../ui/TeamCrest'

interface TeamGoalsTableProps {
  entries: TeamGoalsEntry[]
  linkTeams?: boolean
}

const TEAM_GOALS_PREVIEW_LIMIT = 10

export function TeamGoalsTable({ entries, linkTeams = true }: TeamGoalsTableProps) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = entries.length > TEAM_GOALS_PREVIEW_LIMIT
  const visibleEntries = expanded ? entries : entries.slice(0, TEAM_GOALS_PREVIEW_LIMIT)

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
      <div className="border-b border-slate-700/40 bg-pitch-900/60 px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Gols por seleção</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700/40">
            <th className="w-px whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              #
            </th>
            <th className="w-full px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Seleção
            </th>
            <th className="w-px whitespace-nowrap px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Gols
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleEntries.map((entry, index) => {
            const teamName = getTeamDisplayName(entry.team.shortName, entry.team.name)
            const teamId = entry.team.id
            const rank = index + 1

            return (
              <tr
                key={teamId ?? teamName}
                className="border-b border-slate-700/20 last:border-b-0"
              >
                <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums text-slate-300">
                  {rank}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">
                  {linkTeams && teamId != null ? (
                    <Link
                      to={`/times/${teamId}`}
                      className="inline-flex min-w-0 max-w-full items-center gap-2 text-white transition hover:text-gold-400"
                      title={teamName}
                    >
                      <TeamCrest
                        crest={entry.team.crest}
                        name={teamName}
                        size="sm"
                        className="!h-4 !w-4 shrink-0 sm:!h-5 sm:!w-5"
                      />
                      <span className="truncate">{teamName}</span>
                    </Link>
                  ) : (
                    <span className="inline-flex min-w-0 max-w-full items-center gap-2 text-white">
                      <TeamCrest
                        crest={entry.team.crest}
                        name={teamName}
                        size="sm"
                        className="!h-4 !w-4 shrink-0 sm:!h-5 sm:!w-5"
                      />
                      <span className="truncate">{teamName}</span>
                    </span>
                  )}
                </td>
                <td className="w-px whitespace-nowrap px-3 py-3 text-center text-base tabular-nums text-lg font-bold text-gold-400">
                  <span className="inline-block min-w-[1.25rem] rounded-lg px-2 py-1 tabular-nums">
                    {entry.goalsFor}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {hasMore && (
        <div className="border-t border-slate-700/40 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full text-slate-400 hover:text-white"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </Button>
        </div>
      )}
    </div>
  )
}
