import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '../../routes/routePaths'
import { BackButton } from '../ui/BackLink'
import { ThemeToggle } from '../ui/ThemeToggle'
import { logoutAdmin } from '../../services/adminAuthService'
import { showToast } from '../../lib/toast'

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()

  async function handleBackToBolao() {
    try {
      await logoutAdmin()
      showToast('Sessão administrativa encerrada.', 'logout')
    } catch {
      // Segue para o bolão mesmo se o logout falhar.
    }
    navigate(APP_ROUTES.home)
  }

  return (
    <div className="flex min-h-screen flex-col bg-pitch-950">
      <header className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <BackButton type="button" onClick={() => void handleBackToBolao()}>
            Bolão 2026
          </BackButton>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm font-medium uppercase tracking-wider text-slate-600">Admin</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
