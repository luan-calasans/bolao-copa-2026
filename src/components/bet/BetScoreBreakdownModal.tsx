import { useEffect, useId, useMemo } from 'react'
import type { BetsTableItem } from '../../models/betsTable'
import { buildBetScoreBreakdown } from '../../utils/betScoreBreakdown'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { Button } from '../ui/Button'
import { resultClasses } from './betsTableStyles'

interface BetScoreBreakdownModalProps {
  item: BetsTableItem | null
  onClose: () => void
}

const hitToneClasses = {
  exact: resultClasses.exact,
  partial: resultClasses.partial,
  winner: resultClasses.winner,
} as const

export function BetScoreBreakdownModal({ item, onClose }: BetScoreBreakdownModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const isOpen = item !== null

  const breakdown = useMemo(() => {
    if (!item?.match) return null

    const { entry } = item.row
    return buildBetScoreBreakdown(
      item.match,
      entry.homeScore,
      entry.awayScore,
      entry.winnerPick,
    )
  }, [item])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !item) return null

  const { match, row } = item
  const matchLabel = match
    ? `${getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)} x ${getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)}`
    : `Jogo #${item.matchId}`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default bg-pitch-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[min(82vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-pitch-900 shadow-2xl shadow-black/40 sm:max-h-[min(90vh,560px)] sm:rounded-2xl"
      >
        <div className="border-b border-slate-700/40 px-3 py-2.5 sm:px-5 sm:py-4">
          <h2 id={titleId} className="text-base font-bold text-white sm:text-lg">
            Detalhes da pontuação
          </h2>
          <p id={descriptionId} className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">
            <span className="font-medium text-slate-300">{row.displayName}</span>
            {' · '}
            {matchLabel}
          </p>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2.5 sm:space-y-3 sm:px-5 sm:py-4">
          {breakdown?.isPending ? (
            <p className="rounded-lg border border-slate-700/40 bg-pitch-950/50 p-3 text-xs text-slate-400 sm:rounded-xl sm:p-4 sm:text-sm">
              Aguardando o fim do jogo para calcular a pontuação.
            </p>
          ) : (
            breakdown?.hits.map((hit) => (
              <div
                key={hit.title}
                className="rounded-lg border border-slate-700/40 bg-pitch-950/50 p-2.5 sm:rounded-xl sm:p-4"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <p className="text-xs font-semibold text-white sm:text-sm">{hit.title}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:text-xs ${hitToneClasses[hit.tone]}`}
                  >
                    +{hit.points} pts
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:mt-2 sm:text-sm">{hit.description}</p>
              </div>
            ))
          )}

          {breakdown && !breakdown.isPending && (
            <div className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-pitch-950/30 px-3 py-2 sm:rounded-xl sm:px-4 sm:py-3">
              <span className="text-xs font-medium text-slate-400 sm:text-sm">Total</span>
              <span className="text-base font-bold tabular-nums text-gold-400 sm:text-lg">
                {breakdown.totalPoints} pts
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/40 bg-pitch-950/40 px-3 py-2.5 sm:px-5 sm:py-4">
          <Button type="button" variant="gold" className="w-full py-2 text-sm sm:py-2.5" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
