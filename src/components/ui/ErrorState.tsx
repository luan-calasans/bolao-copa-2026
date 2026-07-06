import { Button } from './Button'

const API_LOAD_ERROR_HINT =
  'Este bolão usa uma API com restrições de uso. Aguarde alguns segundos e tente novamente.'

interface ErrorStateProps {
  message: string
  statusCode?: number
  onRetry?: () => void
  retryHint?: string | null
}

export function ErrorState({ message, statusCode, onRetry, retryHint }: ErrorStateProps) {
  const title = statusCode != null ? `Erro ao carregar ${statusCode}` : 'Erro ao carregar'
  const hint = retryHint === undefined ? API_LOAD_ERROR_HINT : retryHint

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-xl font-bold text-red-300">
        !
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className={`text-sm text-white ${onRetry ? 'mb-3' : 'mb-6'}`}>{message}</p>
      {onRetry && hint && <p className="mb-6 text-sm text-white">{hint}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
