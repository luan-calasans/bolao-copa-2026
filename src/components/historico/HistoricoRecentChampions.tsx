import { Link } from 'react-router-dom'
import type { TournamentSummary } from '../../models/historicalWorldCup'
import { historicoYearPath } from '../../routes/routePaths'
import { getHistoricalTeamDisplayName } from '../../utils/historicalTeamNames'
import { HistoricalTeamCrest } from './HistoricalTeamCrest'

interface HistoricoRecentChampionsProps {
  summaries: TournamentSummary[]
}

export function HistoricoRecentChampions({ summaries }: HistoricoRecentChampionsProps) {
  const recent = [...summaries].sort((left, right) => right.year - left.year).slice(0, 6)

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white sm:text-lg">Últimas campeãs</h2>
          <p className="mt-1 text-xs text-slate-400">As seis edições mais recentes no acervo.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {recent.map((summary) => (
          <Link
            key={summary.year}
            to={historicoYearPath(summary.year)}
            className="group rounded-2xl border border-slate-700/50 bg-pitch-800/50 p-4 transition hover:border-gold-500/40 hover:bg-pitch-700/40"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {summary.year}
            </p>
            <div className="mt-2 flex justify-center">
              <HistoricalTeamCrest teamName={summary.champion} size="md" />
            </div>
            <p className="mt-2 truncate text-sm font-bold text-gold-400 group-hover:text-gold-300">
              {getHistoricalTeamDisplayName(summary.champion)}
            </p>
            <p className="mt-1 truncate text-xs text-slate-400">
              {summary.finalScore ?? summary.runnerUp ?? 'Ver edição'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
