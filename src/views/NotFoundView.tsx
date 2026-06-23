import { Link } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { Button } from '../components/ui/Button'

export function NotFoundView() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-2 text-8xl font-black text-gold-400/20">404</p>
        <h1 className="mb-3 text-2xl font-bold text-white">Página não encontrada</h1>
        <p className="mb-8 max-w-md text-slate-400">
          A página que você procura não existe ou foi movida. Volte para acompanhar os jogos da Copa
          2026.
        </p>
        <Link to="/">
          <Button variant="gold">Voltar à página inicial</Button>
        </Link>
      </div>
    </AppLayout>
  )
}
