import { useEffect, useId } from 'react'
import type { AiPrediction } from '../../models/aiPrediction'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'

interface AiPredictionModalProps {
  isOpen: boolean
  aiPrediction: AiPrediction | null
  isAiLoading: boolean
  aiError: string | null
  canRequestAi: boolean
  onClose: () => void
  onRequest: () => void
  onApply: () => void
}

export function AiPredictionModal({
  isOpen,
  aiPrediction,
  isAiLoading,
  aiError,
  canRequestAi,
  onClose,
  onRequest,
  onApply,
}: AiPredictionModalProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isAiLoading) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isAiLoading, onClose])

  if (!isOpen) return null

  function handleApply() {
    onApply()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default bg-pitch-950/80 backdrop-blur-sm"
        disabled={isAiLoading}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/30 bg-pitch-900 shadow-2xl shadow-black/40"
      >
        <div className="border-b border-violet-500/20 bg-violet-500/5 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-violet-100">
            Sugestão da IA
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-slate-400">
            Placar estimado pelo Gemini com base no confronto. Apenas para diversão.
          </p>
        </div>

        <div className="px-5 py-5">
          {isAiLoading && <AiPredictionSkeleton />}

          {!isAiLoading && aiError && (
            <div className="text-center">
              <p className="text-sm text-red-400">{aiError}</p>
              {canRequestAi && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4"
                  onClick={onRequest}
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {!isAiLoading && !aiError && aiPrediction && (
            <div className="rounded-xl border border-violet-400/20 bg-pitch-950/50 p-4">
              <p className="text-center text-sm text-slate-400">Placar previsto</p>
              <p className="mt-1 text-center text-3xl font-bold tabular-nums text-violet-200">
                {aiPrediction.homeScore} × {aiPrediction.awayScore}
              </p>
              {aiPrediction.analysis && (
                <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
                  {aiPrediction.analysis}
                </p>
              )}
            </div>
          )}

          {!isAiLoading && !aiError && !aiPrediction && !canRequestAi && (
            <p className="text-center text-sm text-slate-400">
              A sugestão da IA já foi solicitada nesta página.
            </p>
          )}
        </div>

        <div
          className={`grid gap-2 border-t border-slate-700/40 bg-pitch-950/40 px-5 py-4 ${
            aiPrediction && !isAiLoading && !aiError ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {aiPrediction && !isAiLoading && !aiError && (
            <Button type="button" variant="secondary" className="w-full" onClick={handleApply}>
              Usar este placar
            </Button>
          )}
          <Button
            type="button"
            variant="gold"
            className="w-full"
            disabled={isAiLoading}
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

function AiPredictionSkeleton() {
  return (
    <div className="space-y-4 py-2" aria-busy="true" aria-label="Carregando sugestão da IA">
      <Skeleton className="mx-auto h-4 w-28" />
      <Skeleton className="mx-auto h-10 w-32 rounded-lg" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mx-auto h-3 w-11/12" />
        <Skeleton className="mx-auto h-3 w-4/5" />
      </div>
    </div>
  )
}
