import { Link } from 'react-router-dom'
import type { ApiStandingTable } from '../../models/api.types'
import type { StandingsTrend } from '../../utils/matchGroupStandings'
import { formatStandingGroup, getStandingRowClasses } from '../../utils/standingsDisplay'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'
import { StandingTrendIcon } from './StandingTrendIcon'

interface StandingsGroupTableProps {
  standing: ApiStandingTable
  highlightTeamIds?: number[]
  positionTrends?: Map<number, StandingsTrend>
  showTrends?: boolean
  variant?: 'standings' | 'match'
}

export function StandingsGroupTable({
  standing,
  highlightTeamIds = [],
  positionTrends,
  showTrends = false,
  variant = 'standings',
}: StandingsGroupTableProps) {
  const highlightSet = new Set(highlightTeamIds)
  const isMatchVariant = variant === 'match'
  const showTrendColumn = showTrends && !isMatchVariant

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/40 bg-pitch-800/60">
      <div className="border-b border-slate-700/40 bg-pitch-900/60 px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          {formatStandingGroup(standing.group)}
        </h3>
        {(showTrendColumn || (isMatchVariant && showTrends)) && (
          <p className="mt-1 text-[11px] text-slate-400">Projeção com o placar atual do jogo</p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] table-fixed text-left text-xs sm:text-sm">
          <StandingsTableColgroup showTrendColumn={showTrendColumn} />
          <thead>
            <tr className="border-b border-slate-700/40 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
              <th className="px-3 py-3">#</th>
              {showTrendColumn && <th className="px-2 py-3 text-center" aria-label="Tendência" />}
              <th className="px-3 py-3">Time</th>
              <th className="px-3 py-3 text-center">J</th>
              <th className="px-3 py-3 text-center">V</th>
              <th className="px-3 py-3 text-center">E</th>
              <th className="px-3 py-3 text-center">D</th>
              <th className="px-3 py-3 text-center">GP</th>
              <th className="px-3 py-3 text-center">GC</th>
              <th className="px-3 py-3 text-center">SG</th>
              <th className="px-4 py-3 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standing.table.map((row) => {
              const teamName = getTeamDisplayName(row.team.shortName, row.team.name)
              const teamId = row.team.id
              const isHighlighted = teamId != null && highlightSet.has(teamId)
              const trend = teamId != null ? (positionTrends?.get(teamId) ?? 'neutral') : 'neutral'

              return (
                <tr
                  key={row.team.id ?? teamName}
                  className={`border-b border-slate-700/20 last:border-b-0 ${
                    isMatchVariant
                      ? isHighlighted
                        ? 'bg-gold-500/10'
                        : ''
                      : getStandingRowClasses(row.position)
                  }`}
                >
                  <td className="px-3 py-3 font-bold text-slate-300">{row.position}</td>
                  {showTrendColumn && (
                    <td className="px-2 py-3 text-center">
                      <StandingTrendIcon trend={trend} />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    {teamId != null ? (
                      <Link
                        to={`/times/${teamId}`}
                        className="flex min-w-0 items-center gap-2.5 transition hover:text-gold-400"
                        title={teamName}
                      >
                        <TeamCrest
                          crest={row.team.crest}
                          name={teamName}
                          size="sm"
                          className="shrink-0 rounded-lg bg-pitch-900/50 p-0.5"
                        />
                        <span className="truncate font-semibold text-white">{teamName}</span>
                      </Link>
                    ) : (
                      <div className="flex min-w-0 items-center gap-2.5" title={teamName}>
                        <TeamCrest
                          crest={row.team.crest}
                          name={teamName}
                          size="sm"
                          className="shrink-0 rounded-lg bg-pitch-900/50 p-0.5"
                        />
                        <span className="truncate font-semibold text-white">{teamName}</span>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300">
                    {row.playedGames}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300">
                    {row.won}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300">
                    {row.draw}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300">
                    {row.lost}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300">
                    {row.goalsFor}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300">
                    {row.goalsAgainst}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300">
                    {row.goalDifference}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center font-bold tabular-nums text-gold-400">
                    {row.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const STAT_COL_WIDTH = '2.75rem'
const WIDE_STAT_COL_WIDTH = '3rem'

function StandingsTableColgroup({ showTrendColumn }: { showTrendColumn: boolean }) {
  return (
    <colgroup>
      <col style={{ width: '2.5rem' }} />
      {showTrendColumn && <col style={{ width: '2rem' }} />}
      <col />
      <col style={{ width: STAT_COL_WIDTH }} />
      <col style={{ width: STAT_COL_WIDTH }} />
      <col style={{ width: STAT_COL_WIDTH }} />
      <col style={{ width: STAT_COL_WIDTH }} />
      <col style={{ width: WIDE_STAT_COL_WIDTH }} />
      <col style={{ width: WIDE_STAT_COL_WIDTH }} />
      <col style={{ width: WIDE_STAT_COL_WIDTH }} />
      <col style={{ width: '3.25rem' }} />
    </colgroup>
  )
}
