import { Link } from 'react-router-dom'
import { APP_ROUTES, historicoYearPath } from '../../routes/routePaths'

interface HistoricoYearNavProps {
  years: number[]
  currentYear: number
}

export function HistoricoYearNav({ years, currentYear }: HistoricoYearNavProps) {
  const ordered = [...years].sort((left, right) => right - left)

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max gap-2 pb-1">
        <Link
          to={APP_ROUTES.historico}
          className="rounded-full border border-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-gold-500/40 hover:text-gold-300"
        >
          Visão geral
        </Link>
        {ordered.map((year) => {
          const isActive = year === currentYear

          return (
            <Link
              key={year}
              to={historicoYearPath(year)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-gold-500/20 text-gold-300 ring-1 ring-gold-500/40'
                  : 'border border-slate-700/60 text-slate-300 hover:border-gold-500/40 hover:text-gold-300'
              }`}
            >
              {year}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
