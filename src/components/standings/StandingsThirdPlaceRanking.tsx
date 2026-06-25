import { useState } from 'react'
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

            <div className="overflow-hidden rounded-xl border border-slate-700/40">
              <table className="w-full table-auto text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40 bg-pitch-900/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px]">
                    <th className="w-10 px-3 py-3">#</th>
                    <th className="w-14 px-3 py-3">Grupo</th>
                    <th className="px-3 py-3">Seleção</th>
                    <th className="w-10 px-3 py-3 text-center">J</th>
                    <th className="w-10 px-3 py-3 text-center">SG</th>
                    <th className="w-10 px-3 py-3 text-center">GP</th>
                    <th className="w-12 px-3 py-3 text-center">Pts</th>
                    <th className="w-24 px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const { row, group, rank, isQualified } = entry
                    const teamName = getTeamDisplayName(row.team.shortName, row.team.name)
                    const teamId = row.team.id
                    const isCutoffRow = rank === 8

                    return (
                      <tr
                        key={`${group}-${teamId ?? teamName}`}
                        className={`border-b border-slate-700/20 last:border-b-0 ${
                          isQualified ? 'bg-brazil-green/10' : 'bg-red-500/10'
                        } ${isCutoffRow ? '!border-b-2 !border-dashed !border-slate-500/60' : ''}`}
                      >
                        <td className="px-3 py-3 font-bold tabular-nums text-slate-300">{rank}</td>
                        <td className="px-3 py-3 font-semibold text-slate-300">{group}</td>
                        <td className="max-w-0 px-3 py-3">
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
                              <span className="truncate font-semibold text-white">{teamName}</span>
                            </Link>
                          ) : (
                            <div className="flex min-w-0 items-center gap-2" title={teamName}>
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
                        <td className="px-3 py-3 text-center tabular-nums text-slate-300">
                          {row.playedGames}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-slate-300">
                          {row.goalDifference}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-slate-300">
                          {row.goalsFor}
                        </td>
                        <td
                          className={`px-3 py-3 text-center font-bold tabular-nums ${
                            isQualified ? 'text-gold-400' : 'text-slate-400'
                          }`}
                        >
                          {row.points}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                              isQualified
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {isQualified ? 'Classificado' : 'Eliminado'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
