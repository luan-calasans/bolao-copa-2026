import type { AiPrediction } from '../../models/aiPrediction'
import { Button } from '../ui/Button'

interface AiPredictionPanelProps {
  aiPrediction: AiPrediction | null
  isAiLoading: boolean
  aiError: string | null
  canRequestAi?: boolean
  onRequest: () => void
  onApply?: () => void
  className?: string
}

export function AiPredictionPanel({
  aiPrediction,
  isAiLoading,
  aiError,
  canRequestAi = true,
  onRequest,
  onApply,
  className = '',
}: AiPredictionPanelProps) {
  const showRequestButton = canRequestAi

  return (
    <div
      className={`rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-200">Sugestão da IA</p>
          <p className="mt-1 text-xs text-slate-400">
            Placar estimado pelo Gemini com base no confronto. Apenas para diversão.
          </p>
        </div>
        {showRequestButton && (
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={onRequest}
            disabled={isAiLoading}
          >
            {isAiLoading
              ? 'Analisando...'
              : aiPrediction
                ? 'Atualizar sugestão'
                : 'Ver sugestão da IA'}
          </Button>
        )}
      </div>

      {aiError && <p className="mt-4 text-sm text-red-400">{aiError}</p>}

      {aiPrediction && !isAiLoading && (
        <div className="mt-4 rounded-xl border border-violet-400/20 bg-pitch-900/50 p-4">
          <p className="text-center text-sm text-slate-400">Placar previsto</p>
          <p className="mt-1 text-center text-3xl font-bold tabular-nums text-violet-200">
            {aiPrediction.homeScore} × {aiPrediction.awayScore}
          </p>
          {aiPrediction.analysis && (
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">
              {aiPrediction.analysis}
            </p>
          )}
          {onApply && (
            <Button
              type="button"
              variant="ghost"
              className="mx-auto mt-4 block text-violet-200 hover:bg-violet-500/10"
              onClick={onApply}
            >
              Usar este placar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
