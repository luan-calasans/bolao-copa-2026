import { useEffect, useId, useState } from 'react'
import { Button } from '../ui/Button'

export function KnockoutSimulatorInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Como usar o simulador"
        title="Como usar o simulador"
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-600/60 bg-pitch-800/80 text-sm font-bold text-slate-300 transition hover:border-gold-500/50 hover:bg-gold-500/10 hover:text-gold-400"
      >
        i
      </button>

      <KnockoutSimulatorInfoModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

interface KnockoutSimulatorInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

function KnockoutSimulatorInfoModal({ isOpen, onClose }: KnockoutSimulatorInfoModalProps) {
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
            Como usar o simulador
          </h2>
        </div>

        <p
          id={descriptionId}
          className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-400"
        >
          Clique na seleção para definir ou trocar o vencedor — mesmo em confrontos já
          avançados. Depois, clique na bolinha com a bandeira para avançar. O placar é
          opcional nos cards abaixo.
        </p>

        <div className="border-t border-slate-700/40 bg-pitch-950/40 px-5 py-4">
          <Button type="button" variant="gold" className="w-full" onClick={onClose}>
            Entendi
          </Button>
        </div>
      </div>
    </div>
  )
}
