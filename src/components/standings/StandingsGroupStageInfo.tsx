import { useEffect, useId, useState } from 'react'
import { Button } from '../ui/Button'

const TIEBREAKER_CRITERIA = [
  'Maior saldo de gols no grupo',
  'Maior número de gols marcados no grupo',
  'Maior número de pontos no confronto direto',
  'Maior saldo de gols no confronto direto',
  'Maior número de gols no confronto direto',
  'Fair Play (menos cartões: 1 amarelo, 3 dois amarelos, 4 vermelho direto, 5 amarelo + vermelho)',
  'Sorteio da FIFA',
]

export function StandingsGroupStageInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Como funciona a fase de grupos"
        title="Como funciona a fase de grupos"
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-600/60 bg-pitch-800/80 text-sm font-bold text-slate-300 transition hover:border-gold-500/50 hover:bg-gold-500/10 hover:text-gold-400"
      >
        i
      </button>

      <GroupStageInfoModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

interface GroupStageInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

function GroupStageInfoModal({ isOpen, onClose }: GroupStageInfoModalProps) {
  const titleId = useId()
  const descriptionId = useId()

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative z-10 flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-pitch-900 shadow-2xl shadow-black/40"
      >
        <div className="border-b border-slate-700/40 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-white">
            Como funciona a fase de grupos
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-slate-400">
            Regras de classificação da Copa do Mundo 2026.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-400">
          <p>
            Na fase de grupos, as 48 seleções são divididas em{' '}
            <strong className="text-slate-200">12 grupos de 4 equipes</strong> (A a L). Cada
            seleção disputa <strong className="text-slate-200">3 partidas</strong> em turno único,
            enfrentando todos os adversários do seu grupo. A pontuação é{' '}
            <strong className="text-slate-200">3 pontos por vitória</strong>,{' '}
            <strong className="text-slate-200">1 por empate</strong> e nenhum por derrota.
          </p>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quem avança
            </h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Os 2 primeiros colocados de cada um dos 12 grupos</li>
              <li>Os 8 melhores terceiros colocados na classificação geral</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Critérios de desempate
            </h3>
            <p className="mb-2">
              Se duas ou mais equipes terminarem com o mesmo número de pontos, a FIFA aplica os
              critérios abaixo, nesta ordem:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              {TIEBREAKER_CRITERIA.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Significado da tabela
            </h3>
            <ul className="grid gap-1 sm:grid-cols-2">
              <li>
                <strong className="text-slate-200">J</strong>: Jogos
              </li>
              <li>
                <strong className="text-slate-200">V</strong>: Vitórias
              </li>
              <li>
                <strong className="text-slate-200">E</strong>: Empates
              </li>
              <li>
                <strong className="text-slate-200">D</strong>: Derrotas
              </li>
              <li>
                <strong className="text-slate-200">GP</strong>: Gols pro
              </li>
              <li>
                <strong className="text-slate-200">GC</strong>: Gols contra
              </li>
              <li>
                <strong className="text-slate-200">SG</strong>: Saldo de gols
              </li>
              <li>
                <strong className="text-slate-200">Pts</strong>: Pontos
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/40 bg-pitch-950/40 px-5 py-4">
          <Button type="button" variant="gold" className="w-full" onClick={onClose}>
            Entendi
          </Button>
        </div>
      </div>
    </div>
  )
}
