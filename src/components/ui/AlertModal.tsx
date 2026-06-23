import { useEffect, useId } from 'react'
import { Button } from './Button'

interface AlertModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  onClose: () => void
}

export function AlertModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Entendi',
  onClose,
}: AlertModalProps) {
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
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-pitch-900 shadow-2xl shadow-black/40"
      >
        <div className="border-b border-slate-700/40 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-white">
            {title}
          </h2>
        </div>

        <div className="px-5 py-4">
          <p id={descriptionId} className="text-sm leading-relaxed text-slate-300">
            {description}
          </p>
        </div>

        <div className="border-t border-slate-700/40 bg-pitch-950/40 px-5 py-4">
          <Button type="button" variant="gold" className="w-full" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
