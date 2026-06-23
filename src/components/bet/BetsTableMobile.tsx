import type { BetsTableItem } from '../../models/betsTable'
import { formatDateTime } from '../../utils/dateFormatter'
import { getBetActivityTimestamp } from '../../utils/betTimestamps'
import { BetResultBadge } from './BetResultBadge'
import { BetScoreWithOutcome } from './BetScoreWithOutcome'
import { ParticipantNameCell, ReceiptIconLink, ReceiptScoreLink } from './BetsTableLinks'
import {
  ChampionBetMatchPlaceholder,
  ChampionBetPickDisplay,
  CompactMatchTeams,
  MatchMetaInfo,
} from './BetsTableShared'
import { deleteButtonClass } from './betsTableStyles'

export interface BetsTableRowProps {
  item: BetsTableItem
  showMatchMeta: boolean
  showMatchTeams: boolean
  showBetOutcome: boolean
  showGeneratedAt: boolean
  showActions: boolean
  linkParticipantProfile: boolean
  showReceiptLink: boolean
  showParticipantColumn: boolean
  deletingReceiptId: string | null
  onDelete?: (receiptId: string, participantName?: string) => void
  onResultClick?: (item: BetsTableItem) => void
}

export function BetsTableMobileCard({
  item,
  showMatchMeta,
  showMatchTeams,
  showBetOutcome,
  showGeneratedAt,
  showActions,
  linkParticipantProfile,
  showReceiptLink,
  showParticipantColumn,
  deletingReceiptId,
  onDelete,
  onResultClick,
}: BetsTableRowProps) {
  const { match, matchId, row, championTeam } = item
  const { entry, displayName, resultStatus, points } = row
  const isDeleting = deletingReceiptId === entry.receiptId
  const score = championTeam ? (
    <ChampionBetPickDisplay team={championTeam} />
  ) : (
    <BetScoreWithOutcome
      homeScore={entry.homeScore}
      awayScore={entry.awayScore}
      winnerPick={entry.winnerPick}
      match={match}
      showBetOutcome={showBetOutcome}
    />
  )

  return (
    <li className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-4">
      {showMatchMeta && (
        <div className="mb-3 min-w-0">
          {match ? (
            <MatchMetaInfo match={match} />
          ) : (
            <span className="text-xs text-slate-500">Jogo #{matchId}</span>
          )}
        </div>
      )}

      {showMatchTeams && (
        <div className="mb-3 min-w-0">
          {championTeam ? (
            <ChampionBetMatchPlaceholder />
          ) : match ? (
            <CompactMatchTeams match={match} matchId={matchId} />
          ) : (
            <span className="text-xs text-slate-500">Jogo #{matchId}</span>
          )}
        </div>
      )}

      {showParticipantColumn &&
        (linkParticipantProfile ? (
          <ParticipantNameCell
            displayName={displayName}
            personName={entry.personName}
            linkParticipantProfile
          />
        ) : (
          <p className="font-medium text-white">{displayName}</p>
        ))}

      {showGeneratedAt && (
        <p className="mt-1 text-xs text-slate-500">
          Atualizado em {formatDateTime(getBetActivityTimestamp(entry))}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {showReceiptLink ? score : <ReceiptScoreLink receiptId={entry.receiptId}>{score}</ReceiptScoreLink>}
        {showReceiptLink && <ReceiptIconLink receiptId={entry.receiptId} />}
        <BetResultBadge
          points={points}
          resultStatus={resultStatus}
          className="mt-0.5 shrink-0 text-xs font-semibold"
          onClick={onResultClick ? () => onResultClick(item) : undefined}
        />
        {showActions && onDelete && (
          <button
            type="button"
            className={deleteButtonClass}
            disabled={deletingReceiptId !== null}
            onClick={() => onDelete(entry.receiptId, displayName)}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        )}
      </div>
    </li>
  )
}
