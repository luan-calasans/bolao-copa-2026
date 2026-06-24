import type { BetsTableItem } from '../../models/betsTable'
import {
  getBetTableSortHint,
  type BetTableSortColumn,
  type BetTableSortState,
} from '../../utils/betTableSort'
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
import {
  deleteButtonClass,
  deleteButtonDisabledClass,
  getBetsTableActionsBodyCellClass,
  getBetsTableActionsHeaderCellClass,
  getBetsTableBodyCellClass,
  getBetsTableColumnEdgeFlags,
  getBetsTableHeaderCellClass,
  headerLabelClass,
  matchTeamsColumnClass,
  participantColumnClass,
  generatedAtColumnClass,
  matchMetaColumnClass,
  scoreColumnClass,
  resultColumnClass,
  receiptColumnClass,
  type BetsTableColumnVisibility,
} from './betsTableStyles'
import type { BetsTableRowProps } from './BetsTableMobile'

interface SortableHeaderProps {
  label: string
  column: BetTableSortColumn
  sort: BetTableSortState | null
  onSort: (column: BetTableSortColumn) => void
  className: string
  align?: 'left' | 'center'
}

function SortableHeader({
  label,
  column,
  sort,
  onSort,
  className,
  align = 'left',
}: SortableHeaderProps) {
  const isActive = sort?.column === column
  const direction = isActive ? sort.direction : null
  const alignClass = align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex w-full items-center gap-1 ${alignClass} ${headerLabelClass} cursor-pointer transition hover:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500/50 ${isActive ? 'text-slate-300' : ''}`}
        aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
        title={
          direction ? getBetTableSortHint(column, direction) : `Ordenar por ${label.toLowerCase()}`
        }
      >
        <span>{label}</span>
        {direction && (
          <span className="text-gold-400" aria-hidden="true">
            {direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    </th>
  )
}

function headerClassFor(
  columnId: Parameters<typeof getBetsTableColumnEdgeFlags>[0],
  columnClass: string,
  visibility: BetsTableColumnVisibility,
): string {
  const edge = getBetsTableColumnEdgeFlags(columnId, visibility)
  return getBetsTableHeaderCellClass(columnClass, edge.isFirst, edge.isLast)
}

function bodyClassFor(
  columnId: Parameters<typeof getBetsTableColumnEdgeFlags>[0],
  columnClass: string,
  visibility: BetsTableColumnVisibility,
  extra = '',
): string {
  const edge = getBetsTableColumnEdgeFlags(columnId, visibility)
  return `${getBetsTableBodyCellClass(columnClass, edge.isFirst, edge.isLast)} ${extra}`.trim()
}

function BetsTableDesktopRow({
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
  canDeleteBet,
  onResultClick,
}: BetsTableRowProps) {
  const columnVisibility: BetsTableColumnVisibility = {
    showMatchMeta,
    showMatchTeams,
    showParticipantColumn,
    showGeneratedAt,
    showReceiptLink,
    showActions,
  }

  const { match, matchId, row, championTeam } = item
  const { entry, displayName, resultStatus, points } = row
  const isDeleting = deletingReceiptId === entry.receiptId
  const canDelete = canDeleteBet?.(item) ?? true
  const showActionsColumn = showActions && onDelete
  const score = championTeam ? (
    <ChampionBetPickDisplay team={championTeam} comfortable />
  ) : (
    <BetScoreWithOutcome
      homeScore={entry.homeScore}
      awayScore={entry.awayScore}
      winnerPick={entry.winnerPick}
      match={match}
      showBetOutcome={showBetOutcome}
      align="center"
      layout="inline"
      comfortable
    />
  )

  const actionsEdge = getBetsTableColumnEdgeFlags('actions', columnVisibility)

  return (
    <tr className="last:[&>td]:border-b-0">
      {showMatchMeta && (
        <td className={bodyClassFor('matchMeta', matchMetaColumnClass, columnVisibility)}>
          {match ? (
            <MatchMetaInfo match={match} comfortable />
          ) : (
            <span className="truncate text-sm text-slate-500">Jogo #{matchId}</span>
          )}
        </td>
      )}

      {showMatchTeams && (
        <td className={bodyClassFor('matchTeams', matchTeamsColumnClass, columnVisibility)}>
          {championTeam ? (
            <ChampionBetMatchPlaceholder comfortable />
          ) : match ? (
            <CompactMatchTeams match={match} matchId={matchId} comfortable display="crests" />
          ) : (
            <span className="truncate text-sm text-slate-500">Jogo #{matchId}</span>
          )}
        </td>
      )}

      {showParticipantColumn && (
        <td
          className={bodyClassFor(
            'participant',
            participantColumnClass,
            columnVisibility,
            'min-w-0',
          )}
        >
          <ParticipantNameCell
            displayName={displayName}
            personName={entry.personName}
            linkParticipantProfile={linkParticipantProfile}
          />
        </td>
      )}

      {showGeneratedAt && (
        <td
          className={bodyClassFor(
            'generatedAt',
            generatedAtColumnClass,
            columnVisibility,
            'text-sm text-slate-400',
          )}
        >
          {formatDateTime(getBetActivityTimestamp(entry))}
        </td>
      )}

      <td className={bodyClassFor('score', scoreColumnClass, columnVisibility, 'min-w-0')}>
        {showReceiptLink ? (
          score
        ) : (
          <ReceiptScoreLink receiptId={entry.receiptId} className="justify-center">
            {score}
          </ReceiptScoreLink>
        )}
      </td>

      <td className={bodyClassFor('result', resultColumnClass, columnVisibility)}>
        <BetResultBadge
          points={points}
          resultStatus={resultStatus}
          onClick={onResultClick ? () => onResultClick(item) : undefined}
        />
      </td>

      {showReceiptLink && (
        <td className={bodyClassFor('receipt', receiptColumnClass, columnVisibility)}>
          <ReceiptIconLink receiptId={entry.receiptId} />
        </td>
      )}

      {showActionsColumn && (
        <td className={getBetsTableActionsBodyCellClass(actionsEdge.isFirst, actionsEdge.isLast)}>
          {canDelete ? (
            <button
              type="button"
              className={deleteButtonClass}
              disabled={deletingReceiptId !== null}
              onClick={() => onDelete(entry.receiptId, displayName)}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </button>
          ) : (
            <button type="button" className={deleteButtonDisabledClass} disabled aria-disabled="true">
              Excluir
            </button>
          )}
        </td>
      )}
    </tr>
  )
}

interface BetsTableDesktopProps {
  items: BetsTableItem[]
  showMatchMeta: boolean
  showMatchTeams: boolean
  showBetOutcome: boolean
  showGeneratedAt: boolean
  showActions: boolean
  sortable: boolean
  linkParticipantProfile: boolean
  showReceiptLink: boolean
  showParticipantColumn: boolean
  sort: BetTableSortState | null
  onSort: (column: BetTableSortColumn) => void
  deletingReceiptId: string | null
  onDelete?: (receiptId: string, participantName?: string) => void
  canDeleteBet?: (item: BetsTableItem) => boolean
  onResultClick?: (item: BetsTableItem) => void
}

export function BetsTableDesktop({
  items,
  showMatchMeta,
  showMatchTeams,
  showBetOutcome,
  showGeneratedAt,
  showActions,
  sortable,
  linkParticipantProfile,
  showReceiptLink,
  showParticipantColumn,
  sort,
  onSort,
  deletingReceiptId,
  onDelete,
  canDeleteBet,
  onResultClick,
}: BetsTableDesktopProps) {
  const columnVisibility: BetsTableColumnVisibility = {
    showMatchMeta,
    showMatchTeams,
    showParticipantColumn,
    showGeneratedAt,
    showReceiptLink,
    showActions,
  }

  const actionsEdge = getBetsTableColumnEdgeFlags('actions', columnVisibility)

  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-slate-700/50 bg-pitch-800/40 lg:block">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-pitch-900/40">
          <tr>
            {showMatchMeta &&
              (sortable ? (
                <SortableHeader
                  label="Jogo / Data"
                  column="matchDate"
                  sort={sort}
                  onSort={onSort}
                  className={headerClassFor('matchMeta', matchMetaColumnClass, columnVisibility)}
                />
              ) : (
                <th className={headerClassFor('matchMeta', matchMetaColumnClass, columnVisibility)}>
                  Jogo / Data
                </th>
              ))}
            {showMatchTeams &&
              (sortable ? (
                <SortableHeader
                  label="Partida"
                  column="match"
                  sort={sort}
                  onSort={onSort}
                  className={headerClassFor('matchTeams', matchTeamsColumnClass, columnVisibility)}
                />
              ) : (
                <th className={headerClassFor('matchTeams', matchTeamsColumnClass, columnVisibility)}>
                  Partida
                </th>
              ))}
            {showParticipantColumn &&
              (sortable ? (
                <SortableHeader
                  label="Participante"
                  column="participant"
                  sort={sort}
                  onSort={onSort}
                  className={headerClassFor(
                    'participant',
                    participantColumnClass,
                    columnVisibility,
                  )}
                />
              ) : (
                <th
                  className={headerClassFor('participant', participantColumnClass, columnVisibility)}
                >
                  Participante
                </th>
              ))}
            {showGeneratedAt &&
              (sortable ? (
                <SortableHeader
                  label="Atualizado em"
                  column="generatedAt"
                  sort={sort}
                  onSort={onSort}
                  className={headerClassFor(
                    'generatedAt',
                    generatedAtColumnClass,
                    columnVisibility,
                  )}
                />
              ) : (
                <th
                  className={headerClassFor(
                    'generatedAt',
                    generatedAtColumnClass,
                    columnVisibility,
                  )}
                >
                  Atualizado em
                </th>
              ))}
            <th className={headerClassFor('score', scoreColumnClass, columnVisibility)}>Palpite</th>
            {sortable ? (
              <SortableHeader
                label="Resultado"
                column="result"
                sort={sort}
                onSort={onSort}
                align="center"
                className={headerClassFor('result', resultColumnClass, columnVisibility)}
              />
            ) : (
              <th className={headerClassFor('result', resultColumnClass, columnVisibility)}>
                Resultado
              </th>
            )}
            {showReceiptLink && (
              <th className={headerClassFor('receipt', receiptColumnClass, columnVisibility)}>
                Comprovante
              </th>
            )}
            {showActions && (
              <th
                className={getBetsTableActionsHeaderCellClass(actionsEdge.isFirst, actionsEdge.isLast)}
              >
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <BetsTableDesktopRow
              key={item.row.entry.receiptId}
              item={item}
              showMatchMeta={showMatchMeta}
              showMatchTeams={showMatchTeams}
              showBetOutcome={showBetOutcome}
              showGeneratedAt={showGeneratedAt}
              showActions={showActions}
              linkParticipantProfile={linkParticipantProfile}
              showReceiptLink={showReceiptLink}
              showParticipantColumn={showParticipantColumn}
              deletingReceiptId={deletingReceiptId}
              onDelete={onDelete}
              canDeleteBet={canDeleteBet}
              onResultClick={onResultClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type { BetTableSortColumn, BetTableSortState }
