import type { BetResultStatus } from '../../utils/betResult'

export const resultClasses = {
  exact:
    'bet-result-badge bet-result-exact border-brazil-green/50 bg-brazil-green/10 text-brazil-green',
  exactCombo:
    'bet-result-badge bet-result-exact-combo border-emerald-400/50 bg-emerald-400/15 text-emerald-300',
  partial: 'bet-result-badge bet-result-partial border-sky-500/50 bg-sky-500/10 text-sky-300',
  winner:
    'bet-result-badge bet-result-winner border-brazil-yellow/50 bg-brazil-yellow/10 text-brazil-yellow',
  combo:
    'bet-result-badge bet-result-combo border-teal-400/50 bg-teal-500/10 text-teal-300',
  none: 'bet-result-badge bet-result-none border-red-500/50 bg-red-500/10 text-red-300',
  pending:
    'bet-result-badge bet-result-pending border-slate-600/50 bg-slate-700/30 text-slate-300',
} as const

export function getBetResultPointsClass(points: number | null, status: BetResultStatus): string {
  if (status === 'pending' || points === null) {
    return resultClasses.pending
  }

  switch (points) {
    case 2:
      return resultClasses.winner
    case 3:
      return resultClasses.partial
    case 5:
      return resultClasses.combo
    case 12:
      return resultClasses.exactCombo
    case 0:
      return resultClasses.none
    default:
      return points >= 10 ? resultClasses.exact : resultClasses.partial
  }
}

export const headerLabelClass = 'text-sm font-semibold uppercase tracking-wider text-slate-500'
export const resultBadgeClass = 'text-sm font-semibold'
export const participantNameClass = 'text-sm font-semibold'

export const bodyCellBase = 'py-3 align-middle border-b border-slate-700/30'
export const headerCellBase = `py-3 align-middle border-b border-slate-700/40 ${headerLabelClass}`

export const actionsCellBase = 'py-3 align-middle border-b border-slate-700/30 text-center whitespace-nowrap'
export const actionsHeaderBase = `py-3 align-middle border-b border-slate-700/40 text-center whitespace-nowrap ${headerLabelClass}`

export const deleteButtonClass =
  'inline-flex cursor-pointer rounded-full border border-red-500/50 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50'

export const matchMetaColumnClass = 'min-w-[10rem] text-left'
export const matchTeamsColumnClass = 'w-[10rem] min-w-[10rem] text-center'
export const participantColumnClass = 'w-[14rem] min-w-[14rem] max-w-[14rem] text-left'
export const generatedAtColumnClass = 'min-w-[11rem] whitespace-nowrap text-left'
export const scoreColumnClass = 'min-w-[6.5rem] max-w-[12rem] text-center'
export const resultColumnClass = 'min-w-[7rem] text-center'
export const receiptColumnClass = 'min-w-[7rem] text-center'

export function getBetsTableCellPadding(isFirst: boolean, isLast: boolean): string {
  if (isFirst && isLast) return 'px-4'
  if (isFirst) return 'pl-4 pr-10'
  if (isLast) return 'pl-10 pr-4'
  return 'px-10'
}

export function getBetsTableBodyCellClass(
  columnClass: string,
  isFirst: boolean,
  isLast: boolean,
): string {
  return `${bodyCellBase} ${getBetsTableCellPadding(isFirst, isLast)} ${columnClass}`.trim()
}

export function getBetsTableHeaderCellClass(
  columnClass: string,
  isFirst: boolean,
  isLast: boolean,
): string {
  return `${headerCellBase} ${getBetsTableCellPadding(isFirst, isLast)} ${columnClass}`.trim()
}

export function getBetsTableActionsBodyCellClass(isFirst: boolean, isLast: boolean): string {
  return `${actionsCellBase} ${getBetsTableCellPadding(isFirst, isLast)}`.trim()
}

export function getBetsTableActionsHeaderCellClass(isFirst: boolean, isLast: boolean): string {
  return `${actionsHeaderBase} ${getBetsTableCellPadding(isFirst, isLast)}`.trim()
}

export interface BetsTableColumnVisibility {
  showMatchMeta: boolean
  showMatchTeams: boolean
  showParticipantColumn: boolean
  showGeneratedAt: boolean
  showReceiptLink: boolean
  showActions: boolean
}

export type BetsTableColumnId =
  | 'matchMeta'
  | 'matchTeams'
  | 'participant'
  | 'generatedAt'
  | 'score'
  | 'result'
  | 'receipt'
  | 'actions'

export function getBetsTableColumnEdgeFlags(
  columnId: BetsTableColumnId,
  visibility: BetsTableColumnVisibility,
): { isFirst: boolean; isLast: boolean } {
  const visibleColumns: BetsTableColumnId[] = [
    visibility.showMatchMeta && 'matchMeta',
    visibility.showMatchTeams && 'matchTeams',
    visibility.showParticipantColumn && 'participant',
    visibility.showGeneratedAt && 'generatedAt',
    'score',
    'result',
    visibility.showReceiptLink && 'receipt',
    visibility.showActions && 'actions',
  ].filter(Boolean) as BetsTableColumnId[]

  const index = visibleColumns.indexOf(columnId)
  if (index === -1) {
    return { isFirst: false, isLast: false }
  }

  return {
    isFirst: index === 0,
    isLast: index === visibleColumns.length - 1,
  }
}
