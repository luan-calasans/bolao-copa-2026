import { useEffect } from 'react'
import { AdminLayout } from '../components/layout/AdminLayout'
import { Button } from '../components/ui/Button'
import { useAdminLoginViewModel } from '../viewmodels/useAdminLoginViewModel'

export function AdminLoginView() {
  const {
    password,
    isSubmitting,
    error,
    isConfigured,
    isBlocked,
    setPassword,
    submitLogin,
    checkSession,
  } = useAdminLoginViewModel()

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitLogin()
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-sm">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Entrar</h1>
          <p className="mt-1 text-sm text-slate-500">Gerenciar palpites do bolão.</p>
        </div>

        {!isConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Configure <code className="text-amber-100">ADMIN_PASSWORD</code> e{' '}
            <code className="text-amber-100">ADMIN_SESSION_SECRET</code> nas variáveis de ambiente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="sr-only">
              Senha administrativa
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting || !isConfigured || isBlocked}
              className="w-full rounded-lg border border-slate-700/60 bg-pitch-900/60 px-4 py-2.5 text-base text-white placeholder:text-slate-600 outline-none transition focus:border-slate-500 disabled:opacity-60"
              placeholder="Senha"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={isSubmitting || !isConfigured || isBlocked}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </AdminLayout>
  )
}
