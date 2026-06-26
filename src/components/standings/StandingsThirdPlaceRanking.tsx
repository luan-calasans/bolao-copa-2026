import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { ThirdPlaceRankingEntry } from '../../utils/thirdPlaceRanking'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface StandingsThirdPlaceRankingProps {
  entries: ThirdPlaceRankingEntry[]
}

const THIRDS_TIEBREAKER_CRITERIA = [
  'Maior número de pontos na fase de grupos',
  'Maior saldo de gols na fase de grupos',
  'Maior número de gols marcados na fase de grupos',
]

const THIRDS_RANK_COL_WIDTH = '2.5rem'
const THIRDS_GROUP_COL_WIDTH = '3.5rem'
const THIRDS_STAT_COL_WIDTH = '2.75rem'
const THIRDS_POINTS_COL_WIDTH = '3rem'
const THIRDS_STATUS_COL_WIDTH = '5rem'
const THIRDS_SELECTION_LAYOUT_BASE = '5.5rem'
const THIRDS_FIXED_TABLE_WIDTH_REM =
  2.5 + 3.5 + 5.5 + 2.75 * 3 + 3 + 5

function buildThirdPlaceTableLayout(entries: ThirdPlaceRankingEntry[]) {
  const longestNameLength = entries.reduce((max, entry) => {
    const name = getTeamDisplayName(entry.row.team.shortName, entry.row.team.name)
    return Math.max(max, name.length)
  }, 0)

  const nameChars = Math.max(longestNameLength + 2, 'Seleção'.length)

  return {
    selectionColumnWidth: `calc(${THIRDS_SELECTION_LAYOUT_BASE} + ${nameChars}ch)`,
    tableMinWidth: `calc(${THIRDS_FIXED_TABLE_WIDTH_REM}rem + ${nameChars}ch)`,
  }
}

function ThirdPlaceQualificationIcon({ isQualified }: { isQualified: boolean }) {
  const label = isQualified ? 'Classificado' : 'Eliminado'

  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center ${
        isQualified ? 'text-emerald-400' : 'text-red-400'
      }`}
      title={label}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d={isQualified ? 'M8 3l5 6H3l5-6z' : 'M8 13l5-6H3l5 6z'}
        />
      </svg>
    </span>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function StandingsThirdPlaceRanking({ entries }: StandingsThirdPlaceRankingProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const tableLayout = useMemo(() => buildThirdPlaceTableLayout(entries), [entries])

  if (entries.length === 0) {
    return null
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls="standings-third-place-panel"
        className="flex w-full cursor-pointer items-center justify-between gap-2 border-b border-slate-700/40 bg-pitch-900/60 px-4 py-3 text-left sm:px-5"
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Disputa dos terceiros
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Os 8 melhores terceiros colocados avançam ao mata-mata
          </p>
        </div>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="standings-third-place-panel"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`space-y-4 px-4 py-4 sm:px-5 ${isExpanded ? '' : ''}`}>
            <p className="text-sm leading-relaxed text-slate-400">
              Entre os <strong className="text-slate-200">12 terceiros colocados</strong> dos
              grupos, apenas os <strong className="text-slate-200">8 primeiros</strong> neste
              ranking seguem para a fase eliminatória. A linha tracejada marca o corte de
              classificação.
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-700/40 sm:overflow-visible">
              <div
                className="w-full overflow-x-auto sm:overflow-x-visible"
                style={
                  {
                    '--thirds-table-min-width': tableLayout.tableMinWidth,
                    '--thirds-selection-min-width': tableLayout.selectionColumnWidth,
                  } as CSSProperties
                }
              >
                <table className="w-full min-w-[var(--thirds-table-min-width)] border-collapse table-fixed text-left text-xs sm:min-w-0 sm:text-sm">
                <colgroup>
                  <col style={{ width: THIRDS_RANK_COL_WIDTH }} />
                  <col style={{ width: THIRDS_GROUP_COL_WIDTH }} />
                  <col />
                  <col style={{ width: THIRDS_STAT_COL_WIDTH }} />
                  <col style={{ width: THIRDS_STAT_COL_WIDTH }} />
                  <col style={{ width: THIRDS_STAT_COL_WIDTH }} />
                  <col style={{ width: THIRDS_POINTS_COL_WIDTH }} />
                  <col style={{ width: THIRDS_STATUS_COL_WIDTH }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-700/40 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
                    <th className="bg-pitch-900/60 px-3 py-3">#</th>
                    <th className="bg-pitch-900/60 py-3 pl-3 pr-5">Grupo</th>
                    <th className="min-w-[var(--thirds-selection-min-width)] bg-pitch-900/60 py-3 pl-5 pr-3 sm:min-w-0">
                      Seleção
                    </th>
                    <th className="bg-pitch-900/60 px-3 py-3 text-center">J</th>
                    <th className="bg-pitch-900/60 px-3 py-3 text-center">SG</th>
                    <th className="bg-pitch-900/60 px-3 py-3 text-center">GP</th>
                    <th className="bg-pitch-900/60 px-3 py-3 text-center">Pts</th>
                    <th className="whitespace-nowrap bg-pitch-900/60 py-3 pl-3 pr-5 text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const { row, group, rank, isQualified } = entry
                    const teamName = getTeamDisplayName(row.team.shortName, row.team.name)
                    const teamId = row.team.id
                    const isCutoffRow = rank === 8
                    const rowBgClass = isQualified ? 'bg-brazil-green/10' : 'bg-red-500/10'

                    return (
                      <tr
                        key={`${group}-${teamId ?? teamName}`}
                        className={`border-b border-slate-700/20 last:border-b-0 ${
                          isCutoffRow ? '!border-b-2 !border-dashed !border-slate-500/60' : ''
                        }`}
                      >
                        <td
                          className={`px-3 py-3 font-bold tabular-nums text-slate-300 ${rowBgClass}`}
                        >
                          {rank}
                        </td>
                        <td className={`py-3 pl-3 pr-5 font-semibold text-slate-300 ${rowBgClass}`}>
                          {group}
                        </td>
                        <td
                          className={`min-w-[var(--thirds-selection-min-width)] py-3 pl-5 pr-3 sm:min-w-0 ${rowBgClass}`}
                        >
                          {teamId != null ? (
                            <Link
                              to={`/times/${teamId}`}
                              className="flex min-w-0 items-center gap-2 transition hover:text-gold-400"
                              title={teamName}
                            >
                              <TeamCrest
                                crest={row.team.crest}
                                name={teamName}
                                size="sm"
                                className="shrink-0 rounded-lg bg-pitch-900/50 p-0.5"
                              />
                              <span className="min-w-0 font-semibold whitespace-nowrap text-white sm:truncate">
                                {teamName}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex min-w-0 items-center gap-2" title={teamName}>
                              <TeamCrest
                                crest={row.team.crest}
                                name={teamName}
                                size="sm"
                                className="shrink-0 rounded-lg bg-pitch-900/50 p-0.5"
                              />
                              <span className="min-w-0 font-semibold whitespace-nowrap text-white sm:truncate">
                                {teamName}
                              </span>
                            </div>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300 ${rowBgClass}`}
                        >
                          {row.playedGames}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300 ${rowBgClass}`}
                        >
                          {row.goalDifference}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-3 text-center tabular-nums text-slate-300 ${rowBgClass}`}
                        >
                          {row.goalsFor}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-3 text-center font-bold tabular-nums ${rowBgClass} ${
                            isQualified ? 'text-gold-400' : 'text-slate-400'
                          }`}
                        >
                          {row.points}
                        </td>
                        <td className={`py-3 pl-3 pr-5 text-center ${rowBgClass}`}>
                          <ThirdPlaceQualificationIcon isQualified={isQualified} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Critérios de desempate entre terceiros
              </h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-400">
                {THIRDS_TIEBREAKER_CRITERIA.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
