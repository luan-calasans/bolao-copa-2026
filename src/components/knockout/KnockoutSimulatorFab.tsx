import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../routes/routePaths'
import { Button } from '../ui/Button'

export function KnockoutSimulatorFab() {
  return (
    <Link
      to={APP_ROUTES.knockoutSimulator}
      className="fixed bottom-6 left-4 z-40 hidden cursor-pointer sm:bottom-8 sm:left-6 lg:inline-flex"
      aria-label="Abrir simulador de mata-mata"
    >
      <Button
        variant="gold"
        className="gap-2.5 px-5 py-3 text-sm shadow-lg shadow-brazil-yellow/25 ring-2 ring-gold-400/25 transition-transform hover:scale-[1.02] sm:text-base"
      >
        <SimulatorIcon />
        Simule sua chave
      </Button>
    </Link>
  )
}

function SimulatorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <circle cx="12" cy="12" r="4" />
      <path d="m16 8 2-2" />
      <path d="m8 16-2 2" />
      <path d="m8 8-2-2" />
      <path d="m16 16 2 2" />
    </svg>
  )
}
