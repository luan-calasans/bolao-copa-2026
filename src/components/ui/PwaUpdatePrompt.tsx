import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex justify-center px-4 sm:bottom-24"
    >
      <div className="pwa-update-prompt pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border border-brazil-green/40 bg-pitch-900/95 px-4 py-3 text-sm font-medium text-emerald-400 shadow-lg shadow-black/30 backdrop-blur-md">
        <span className="leading-snug">Nova versão disponível.</span>
        <button
          type="button"
          onClick={() => void updateServiceWorker()}
          className="shrink-0 rounded-lg bg-brazil-green/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-brazil-green/30"
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
