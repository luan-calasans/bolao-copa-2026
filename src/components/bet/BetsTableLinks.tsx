import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getParticipantBetsPathFromName } from '../../utils/participantRoutes'
import { participantNameClass } from './betsTableStyles'

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
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/50 bg-pitch-900/60 text-slate-400 transition hover:border-gold-500/40 hover:bg-gold-500/10 hover:text-gold-400"
      title="Ver comprovante"
      aria-label="Ver comprovante"
    >
      <ReceiptIcon />
    </Link>
  )
}

function ReceiptIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  )
}
