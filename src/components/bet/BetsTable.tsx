import { useMemo, useState } from 'react'
import type { BetsTableItem } from '../../models/betsTable'
import {
  sortBetsTableItems,
  toggleBetTableSort,
  type BetTableSortColumn,
  type BetTableSortState,
} from '../../utils/betTableSort'
import { BetScoreBreakdownModal } from './BetScoreBreakdownModal'
import { BetsTableDesktop } from './BetsTableDesktop'
import { BetsTableMobileCard } from './BetsTableMobile'

export type { BetsTableItem } from '../../models/betsTable'

interface BetsTableProps {
  items: BetsTableItem[]
  deletingReceiptId?: string | null
  onDelete?: (receiptId: string, participantName?: string) => void
  canDeleteBet?: (item: BetsTableItem) => boolean
  showMatchMeta?: boolean
  showMatchTeams?: boolean
  showBetOutcome?: boolean
  showGeneratedAt?: boolean
  sortable?: boolean
  linkParticipantProfile?: boolean
  showReceiptLink?: boolean
  showParticipantColumn?: boolean
}

export function BetsTable({
  items,
  deletingReceiptId = null,
  onDelete,
  canDeleteBet,
  showMatchMeta = false,
  showMatchTeams = false,
  showBetOutcome = false,
  showGeneratedAt = false,
  sortable = false,
  linkParticipantProfile = true,
  showReceiptLink = false,
  showParticipantColumn = true,
}: BetsTableProps) {
  const showActions =
    Boolean(onDelete)
  const [sort, setSort] = useState<BetTableSortState | null>(null)
  const [breakdownItem, setBreakdownItem] = useState<BetsTableItem | null>(null)

  const displayItems = useMemo(() => {
    if (!sortable || !sort) return items
    return sortBetsTableItems(items, sort)
  }, [items, sort, sortable])

  function handleSort(column: BetTableSortColumn) {
    setSort((current) => toggleBetTableSort(current, column))
  }

  const rowProps = {
    showMatchMeta,
    showMatchTeams,
    showBetOutcome,
    showGeneratedAt,
    showActions,
    deletingReceiptId,
    onDelete,
    canDeleteBet,
    linkParticipantProfile,
    showReceiptLink,
    showParticipantColumn,
    onResultClick: (item: BetsTableItem) => {
      if (item.championTeam) return
      if (item.match && item.row.resultStatus !== 'pending') {
        setBreakdownItem(item)
      }
    },
  }

  return (
    <>
      <ul className="space-y-3 lg:hidden">
        {displayItems.map((item) => (
          <BetsTableMobileCard key={item.row.entry.receiptId} item={item} {...rowProps} />
        ))}
      </ul>

      <BetsTableDesktop
        items={displayItems}
        sortable={sortable}
        sort={sort}
        onSort={handleSort}
        {...rowProps}
      />

      <BetScoreBreakdownModal item={breakdownItem} onClose={() => setBreakdownItem(null)} />
    </>
  )
}
