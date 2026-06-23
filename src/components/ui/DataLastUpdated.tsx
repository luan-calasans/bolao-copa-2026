import { useEffect, useState } from 'react'
import { formatDateTime, formatRelativeTime } from '../../utils/dateFormatter'

interface DataLastUpdatedProps {
  lastUpdated: string
  className?: string
}

export function DataLastUpdated({ lastUpdated, className = '' }: DataLastUpdatedProps) {
  const [relativeLabel, setRelativeLabel] = useState(() => formatRelativeTime(lastUpdated))
  const absoluteLabel = formatDateTime(lastUpdated)

  useEffect(() => {
    function refresh() {
      setRelativeLabel(formatRelativeTime(lastUpdated))
    }

    refresh()

    const intervalId = window.setInterval(refresh, 1_000)

    return () => window.clearInterval(intervalId)
  }, [lastUpdated])

  return (
    <p
      className={`min-h-4 text-center text-xs text-slate-500 ${className}`.trim()}
      aria-live="polite"
    >
      {relativeLabel && absoluteLabel ? (
        <>
          Dados atualizados {relativeLabel}
          <span className="text-slate-600"> · {absoluteLabel}</span>
        </>
      ) : (
        <span className="invisible" aria-hidden="true">
          Dados atualizados
        </span>
      )}
    </p>
  )
}
