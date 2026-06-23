interface EmptyStateProps {
  title?: string
  message?: string
}

export function EmptyState({
  title = 'Nenhum jogo encontrado',
  message = 'Não há jogos disponíveis da Copa do Mundo 2026 no momento.',
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-pitch-800/50 p-10 text-center">
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
