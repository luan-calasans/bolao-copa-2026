import { Link, useNavigate } from 'react-router-dom'
import { LuLogIn, LuLogOut, LuUser } from 'react-icons/lu'
import { useParticipant } from '../../hooks/useParticipant'
import { useTheme } from '../../hooks/useTheme'
import { APP_ROUTES } from '../../routes/routePaths'

interface ParticipantAuthButtonProps {
  className?: string
}

const baseButtonClassName =
  'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition'

const themeToggleButtonClassName =
  'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-700/60 bg-pitch-800/60 text-slate-200 transition hover:border-brazil-yellow/40 hover:bg-pitch-700/80 hover:text-white'

const loginButtonBaseClassName = `${baseButtonClassName} border-brazil-green/35 bg-brazil-green/15 hover:border-brazil-green/50 hover:bg-brazil-green/25`

const logoutButtonBaseClassName = `${baseButtonClassName} border-red-500/35 bg-red-500/15 hover:border-red-400/50 hover:bg-red-500/25`

function getLoginButtonClassName(isLight: boolean) {
  return `${loginButtonBaseClassName} ${
    isLight ? 'text-black hover:text-black' : 'text-emerald-200 hover:text-emerald-100'
  }`
}

function getLogoutButtonClassName(isLight: boolean) {
  return `${logoutButtonBaseClassName} ${
    isLight ? 'text-black hover:text-black' : 'text-red-200 hover:text-red-100'
  }`
}

export function ParticipantAuthButton({ className = '' }: ParticipantAuthButtonProps) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const { isAuthenticated, participant, logout } = useParticipant()

  async function handleLogout() {
    await logout()
    navigate(APP_ROUTES.home)
  }

  if (isAuthenticated) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Link
          to={APP_ROUTES.myBets}
          className={themeToggleButtonClassName}
          aria-label={`Meus palpites — ${participant?.personName ?? 'conta'}`}
          title={participant?.personName ?? 'Meus palpites'}
        >
          <LuUser className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className={getLogoutButtonClassName(isLight)}
          aria-label="Sair da conta"
          title="Sair"
        >
          <LuLogOut className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <Link
      to={APP_ROUTES.participantLogin}
      className={`${getLoginButtonClassName(isLight)} ${className}`}
      aria-label="Entrar no bolão"
      title="Entrar"
    >
      <LuLogIn className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
    </Link>
  )
}
