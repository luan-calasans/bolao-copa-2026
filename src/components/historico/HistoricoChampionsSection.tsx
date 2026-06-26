import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TournamentSummary } from '../../models/historicalWorldCup'
import { historicoYearPath } from '../../routes/routePaths'
import { getHistoricalTeamDisplayName } from '../../utils/historicalTeamNames'
import { HistoricalTeamCrest } from './HistoricalTeamCrest'

interface HistoricoChampionsSectionProps {
  summaries: TournamentSummary[]
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
}

export function HistoricoChampionsSection({ summaries }: HistoricoChampionsSectionProps) {
  const [query, setQuery] = useState('')
  const ordered = useMemo(
    () => [...summaries].sort((left, right) => right.year - left.year),
    [summaries],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)
    if (!normalizedQuery) return ordered

    return ordered.filter((summary) => {
      const championPt = getHistoricalTeamDisplayName(summary.champion)
      const runnerUpPt = summary.runnerUp ? getHistoricalTeamDisplayName(summary.runnerUp) : ''
      const haystack = normalizeSearch(
        `${summary.year} ${summary.champion} ${championPt} ${summary.runnerUp ?? ''} ${runnerUpPt} ${summary.finalScore ?? ''}`,
      )
      return haystack.includes(normalizedQuery)
    })
  }, [ordered, query])

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
      <div className="border-b border-slate-700/40 bg-pitch-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Todas as edições
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Campeões de 1930 a 2022. Busque por ano, seleção ou placar.
            </p>
          </div>
          <label className="w-full sm:max-w-xs">
            <span className="sr-only">Buscar edição</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ano ou seleção..."
              className="w-full rounded-xl border border-slate-700/60 bg-pitch-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            />
          </label>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Ano</th>
              <th className="px-5 py-3">Campeão</th>
              <th className="px-5 py-3">Vice</th>
              <th className="px-5 py-3">Placar</th>
              <th className="px-5 py-3 text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((summary) => (
              <tr
                key={summary.year}
                className="border-b border-slate-700/20 transition hover:bg-pitch-700/20 last:border-b-0"
              >
                <td className="px-5 py-3 font-semibold text-gold-400">{summary.year}</td>
                <td className="px-5 py-3 font-medium text-white">
                  <span className="inline-flex items-center gap-2">
                    <HistoricalTeamCrest teamName={summary.champion} size="sm" className="!h-8 !w-8 sm:!h-9 sm:!w-9" />
                    {getHistoricalTeamDisplayName(summary.champion)}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-300">
                  {summary.runnerUp ? (
                    <span className="inline-flex items-center gap-2">
                      <HistoricalTeamCrest teamName={summary.runnerUp} size="sm" className="!h-8 !w-8 sm:!h-9 sm:!w-9" />
                      {getHistoricalTeamDisplayName(summary.runnerUp)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-3 text-slate-400">{summary.finalScore ?? '—'}</td>
                <td className="px-5 py-3 text-right">
                  <Link
                    to={historicoYearPath(summary.year)}
                    className="text-xs font-semibold text-gold-400 transition hover:text-gold-300"
                  >
                    Ver Copa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-700/30 md:hidden">
        {filtered.map((summary) => (
          <Link
            key={summary.year}
            to={historicoYearPath(summary.year)}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-pitch-700/20"
          >
            <div className="min-w-0 flex items-center gap-3">
              <HistoricalTeamCrest teamName={summary.champion} size="sm" className="!h-9 !w-9" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  {summary.year}
                </p>
                <p className="truncate font-medium text-white">
                  {getHistoricalTeamDisplayName(summary.champion)}
                </p>
                <p className="truncate text-xs text-slate-400">
                  Vice: {summary.runnerUp ? getHistoricalTeamDisplayName(summary.runnerUp) : '—'}
                  {summary.finalScore ? ` · ${summary.finalScore}` : ''}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-gold-400">Ver</span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-slate-400">
          Nenhuma edição encontrada para &quot;{query}&quot;.
        </p>
      )}
    </section>
  )
}
