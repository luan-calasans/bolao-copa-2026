import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { RankingRow } from '../../services/rankingService'
import {
  isRankingStatClickable,
  type RankingStatKind,
  type RankingStatSelection,
} from '../../utils/rankingStatDetails'
import { formatEfficiencyPercent } from '../../utils/betEfficiency'
import { getParticipantBetsPathFromKey } from '../../utils/participantRoutes'
import {
  getRankingTableSortHint,
  isDefaultRankingTableSort,
  sortRankingRows,
  toggleRankingTableSort,
  type RankingTableSortColumn,
  type RankingTableSortState,
} from '../../utils/rankingTableSort'
import { PodiumTrophyIcon } from '../ui/PodiumTrophyIcon'
import {
  getPodiumNameClass,
  getPodiumRankClass,
  getPodiumRowClass,
  isPodiumRank,
} from '../../utils/podiumPlacement'
import { RankingStatModal } from './RankingStatModal'

interface RankingTableProps {
  ranking: RankingRow[]
}

interface RankingStatCellProps {
  value: number
  kind: RankingStatKind
  row: RankingRow
  className?: string
  onSelect: (selection: RankingStatSelection) => void
}

function RankingStatCell({ value, kind, row, className = '', onSelect }: RankingStatCellProps) {
  const clickable = isRankingStatClickable(kind, value, row)
  const valueClass = 'inline-block min-w-[1.25rem] rounded-lg px-2 py-1 tabular-nums'

  if (!clickable) {
    return (
      <td className={`px-4 py-3 text-center text-base tabular-nums ${className}`.trim()}>
        <span className={valueClass}>{value}</span>
      </td>
    )
  }

  const label =
    kind === 'points'
      ? `${value} pontos de ${row.displayName}`
      : kind === 'bets'
        ? `${value} palpites de ${row.displayName}`
        : kind === 'pending'
          ? `${value} jogos aguardando de ${row.displayName}`
          : `${value} ${kind === 'exact' ? 'exatos' : 'parciais'} de ${row.displayName}`

  return (
    <td className={`px-4 py-3 text-center text-base tabular-nums ${className}`.trim()}>
      <button
        type="button"
        onClick={() =>
          onSelect({
            personNameKey: row.personNameKey,
            displayName: row.displayName,
            kind,
            value,
          })
        }
        className={`${valueClass} cursor-pointer [font-size:inherit] transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500/50`}
        aria-label={`Ver detalhes: ${label}`}
        title="Ver detalhes"
      >
        {value}
      </button>
    </td>
  )
}

function getRankingRowClass(index: number, usePodiumStyles: boolean): string {
  if (!usePodiumStyles) return ''

  return getPodiumRowClass(index + 1)
}

interface SortableHeaderProps {
  label: string
  column: RankingTableSortColumn
  sort: RankingTableSortState | null
  onSort: (column: RankingTableSortColumn) => void
  className?: string
  align?: 'left' | 'center'
  title?: string
}

function SortableHeader({
  label,
  column,
  sort,
  onSort,
  className = 'px-4 py-3 text-center',
  align = 'center',
  title,
}: SortableHeaderProps) {
  const isActive = sort?.column === column
  const direction = isActive ? sort.direction : null
  const alignClass = align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex w-full items-center gap-1 ${alignClass} text-[11px] font-semibold uppercase tracking-wider cursor-pointer transition hover:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500/50 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}
        aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
        title={
          title ??
          (direction
            ? getRankingTableSortHint(column, direction)
            : `Ordenar por ${label.toLowerCase()}`)
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

export function RankingTable({ ranking }: RankingTableProps) {
  const [selection, setSelection] = useState<RankingStatSelection | null>(null)
  const [sort, setSort] = useState<RankingTableSortState | null>(null)

  const sortedRanking = useMemo(() => sortRankingRows(ranking, sort), [ranking, sort])
  const usePodiumStyles = isDefaultRankingTableSort(sort)

  function handleSort(column: RankingTableSortColumn) {
    setSort((current) => toggleRankingTableSort(current, column))
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
        <div className="border-b border-slate-700/40 bg-pitch-900/40 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Ranking</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  #
                </th>
                <SortableHeader
                  label="Participante"
                  column="participant"
                  sort={sort}
                  onSort={handleSort}
                  className="px-4 py-3 text-left"
                  align="left"
                />
                <SortableHeader label="Pontos" column="points" sort={sort} onSort={handleSort} />
                <SortableHeader label="Exatos" column="exact" sort={sort} onSort={handleSort} />
                <SortableHeader label="Parciais" column="partial" sort={sort} onSort={handleSort} />
                <SortableHeader
                  label="Eficiência"
                  column="efficiency"
                  sort={sort}
                  onSort={handleSort}
                  title="Taxa de acerto em jogos encerrados"
                />
                <SortableHeader label="Palpites" column="bets" sort={sort} onSort={handleSort} />
                <SortableHeader
                  label="Aguardando"
                  column="pending"
                  sort={sort}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {sortedRanking.map((row, index) => {
                const rank = index + 1
                const showPodium = usePodiumStyles && isPodiumRank(rank)

                return (
                <tr
                  key={row.personNameKey}
                  className={`border-b border-slate-700/20 last:border-b-0 ${getRankingRowClass(index, usePodiumStyles)}`}
                >
                  <td
                    className={`px-4 py-3 font-bold tabular-nums ${
                      showPodium ? getPodiumRankClass(rank) : 'text-slate-300'
                    }`}
                  >
                    {rank}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      to={getParticipantBetsPathFromKey(row.personNameKey)}
                      className={`inline-flex min-w-0 max-w-full items-center gap-2 transition hover:text-gold-400 ${getPodiumNameClass(showPodium ? rank : 0)}`}
                      title="Ver palpites do participante"
                    >
                      {showPodium && <PodiumTrophyIcon rank={rank} />}
                      <span className="truncate">{row.displayName}</span>
                    </Link>
                  </td>
                  <RankingStatCell
                    value={row.totalPoints}
                    kind="points"
                    row={row}
                    className="text-lg font-bold text-gold-400"
                    onSelect={setSelection}
                  />
                  <RankingStatCell
                    value={row.exactHits}
                    kind="exact"
                    row={row}
                    className="bet-result-exact text-emerald-300"
                    onSelect={setSelection}
                  />
                  <RankingStatCell
                    value={row.partialHits}
                    kind="partial"
                    row={row}
                    className="bet-result-partial text-sky-300"
                    onSelect={setSelection}
                  />
                  <td
                    className="px-4 py-3 text-center text-base tabular-nums text-violet-300"
                    title="Taxa de acerto em jogos encerrados"
                  >
                    <span className="inline-block min-w-[1.25rem] rounded-lg px-2 py-1 tabular-nums">
                      {formatEfficiencyPercent(row.hitRateEfficiency)}
                    </span>
                  </td>
                  <RankingStatCell
                    value={row.totalBets}
                    kind="bets"
                    row={row}
                    className="text-slate-300"
                    onSelect={setSelection}
                  />
                  <RankingStatCell
                    value={row.pendingBets}
                    kind="pending"
                    row={row}
                    className="text-slate-500"
                    onSelect={setSelection}
                  />
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RankingStatModal selection={selection} onClose={() => setSelection(null)} />
    </>
  )
}
