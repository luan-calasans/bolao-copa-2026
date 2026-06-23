import { formatBetResultPoints, type BetResultStatus } from '../../utils/betResult'
import { getBetResultPointsClass, resultBadgeClass } from './betsTableStyles'

interface BetResultBadgeProps {
  points: number | null
  resultStatus: BetResultStatus
  onClick?: () => void
  className?: string
}

export function BetResultBadge({
  points,
  resultStatus,
  onClick,
  className = '',
}: BetResultBadgeProps) {
  const label = formatBetResultPoints(resultStatus, points)
  const badgeClass = getBetResultPointsClass(points, resultStatus)
  const isClickable = Boolean(onClick) && resultStatus !== 'pending'
  const sharedClass = `inline-flex rounded-full border px-2.5 py-1 ${resultBadgeClass} ${badgeClass} ${className}`.trim()

  if (!isClickable) {
    return <span className={sharedClass}>{label}</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${sharedClass} cursor-pointer transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500/50`}
      aria-label={`Ver detalhes da pontuação: ${label}`}
    >
      {label}
    </button>
  )
}
