import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../routes/routePaths'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-pitch-900/80">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
        <p>
          2026 Bolão da Copa do Mundo · Dados via{' '}
          <a
            href="https://docs.football-data.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-400 transition hover:text-brazil-yellow"
          >
            football-data.org
          </a>
          {' e '}
          <a
            href="https://www.thesportsdb.com/documentation"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-400 transition hover:text-brazil-yellow"
          >
            TheSportsDB
          </a>
        </p>
        <p className="mt-3">
          Desenvolvido por{' '}
          <a
            href="https://github.com/luan-calasans"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-300 transition hover:text-brazil-yellow"
          >
            Luan Calasans
          </a>
        </p>
        <p className="mt-3">
          <Link
            to={APP_ROUTES.adminLogin}
            className="text-slate-600 transition hover:text-slate-400"
          >
            Administração
          </Link>
        </p>
      </div>
    </footer>
  )
}
