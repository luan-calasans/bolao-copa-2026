import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getParticipantBetsPathFromName } from '../../utils/participantRoutes'
import { participantNameClass, receiptLinkClass } from './betsTableStyles'

interface ParticipantNameCellProps {
  displayName: string
  personName?: string
  linkParticipantProfile: boolean
}

export function ParticipantNameCell({
  displayName,
  personName,
  linkParticipantProfile,
}: ParticipantNameCellProps) {
  if (!linkParticipantProfile) {
    return (
      <span
        className={`block min-w-0 truncate ${participantNameClass} text-white`}
        title={displayName}
      >
        {displayName}
      </span>
    )
  }

  return (
    <Link
      to={getParticipantBetsPathFromName(personName ?? displayName)}
      className={`block min-w-0 truncate ${participantNameClass} text-white transition hover:text-gold-400`}
      title={displayName}
    >
      {displayName}
    </Link>
  )
}

interface ReceiptScoreLinkProps {
  receiptId: string
  children: ReactNode
  className?: string
}

export function ReceiptScoreLink({ receiptId, children, className = '' }: ReceiptScoreLinkProps) {
  return (
    <Link
      to={`/comprovante/${receiptId}`}
      className={`inline-flex min-w-0 max-w-full transition hover:opacity-90 ${className}`.trim()}
      title="Ver comprovante"
    >
      {children}
    </Link>
  )
}

export function ReceiptIconLink({ receiptId }: { receiptId: string }) {
  return (
    <Link
      to={`/comprovante/${receiptId}`}
      className={receiptLinkClass}
      title="Ver comprovante"
    >
      Comprovante
    </Link>
  )
}
