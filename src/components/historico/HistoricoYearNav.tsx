import { Link, useNavigate } from 'react-router-dom'
import { APP_ROUTES, historicoYearPath } from '../../routes/routePaths'

interface HistoricoYearNavProps {
  years: number[]
  currentYear: number
}

const selectClass =
  'w-full min-w-0 cursor-pointer rounded-xl border border-slate-700/60 bg-pitch-900/80 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 sm:max-w-xs'

export function HistoricoYearNav({ years, currentYear }: HistoricoYearNavProps) {
  const navigate = useNavigate()
  const ordered = [...years].sort((left, right) => right - left)

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-sm sm:flex-row sm:items-center sm:gap-3">
        <label
          htmlFor="historico-year-select"
          className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Edição
        </label>
        <select
          id="historico-year-select"
          value={String(currentYear)}
          onChange={(event) => navigate(historicoYearPath(Number(event.target.value)))}
          className={selectClass}
        >
          {ordered.map((year) => (
            <option key={year} value={year}>
              Copa do Mundo {year}
            </option>
          ))}
        </select>
      </div>

      <Link
        to={APP_ROUTES.historico}
        className="shrink-0 self-start rounded-full border border-slate-700/60 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-gold-500/40 hover:text-gold-300 sm:self-center"
      >
        Visão geral
      </Link>
    </div>
  )
}
