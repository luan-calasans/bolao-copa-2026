import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import type { BetsTableItem } from '../../models/betsTable'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import {
  filterRankingStatItems,
  formatRankingStatMatchLabel,
  loadParticipantBetItemsMap,
  RANKING_STAT_DESCRIPTIONS,
  RANKING_STAT_LABELS,
  sortRankingStatItems,
  type RankingStatSelection,
} from '../../utils/rankingStatDetails'
import { buildBetScoreBreakdown } from '../../utils/betScoreBreakdown'
import { formatBetResultLabel } from '../../utils/betResult'
import { CHAMPION_BET_POINTS } from '../../utils/championBet'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { BetScoreBreakdownModal } from '../bet/BetScoreBreakdownModal'
import { BetResultBadge } from '../bet/BetResultBadge'
import { BetScoreWithOutcome } from '../bet/BetScoreWithOutcome'
import { resultClasses } from '../bet/betsTableStyles'
import { Button } from '../ui/Button'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { TeamCrest } from '../ui/TeamCrest'

interface RankingStatModalProps {
  selection: RankingStatSelection | null
  onClose: () => void
}

function RankingStatModalSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="min-w-0 rounded-xl border border-slate-700/40 bg-pitch-950/50 p-3 sm:col-span-2"
        >
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-1">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatSelectionValueLabel(selection: RankingStatSelection): string {
  const { kind, value } = selection

  if (kind === 'points') {
    return `${value} ponto${value === 1 ? '' : 's'} no total`
  }

  if (kind === 'bets') {
    return `${value} palpite${value === 1 ? '' : 's'}`
  }

  if (kind === 'pending') {
    return `${value} palpite${value === 1 ? '' : 's'} aguardando`
  }

  const resultLabel = formatBetResultLabel(kind === 'exact' ? 'exact' : 'partial').toLowerCase()
  return `${value} palpite${value === 1 ? '' : 's'} ${resultLabel}${value === 1 ? '' : 's'}`
}

function resolveRankingStatItems(
  selection: RankingStatSelection,
  itemsByPerson: Map<string, BetsTableItem[]>,
): BetsTableItem[] {
  const participantItems = itemsByPerson.get(selection.personNameKey) ?? []
  const filtered = filterRankingStatItems(participantItems, selection.kind)
  return sortRankingStatItems(filtered, selection.kind)
}

function ChampionBetBreakdown() {
  return (
    <ul className="mt-2.5 grid grid-cols-1 gap-2">
      <li className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/30 bg-pitch-900/40 px-2.5 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-300">Campeão da Copa</p>
          <p className="mt-0.5 break-words text-[11px] leading-snug text-slate-500">
            Acertou a seleção vencedora da final.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${resultClasses.exact}`}
        >
          +{CHAMPION_BET_POINTS}
        </span>
      </li>
    </ul>
  )
}

function RankingStatBetCard({
  item,
  showBreakdown,
  onResultClick,
}: {
  item: BetsTableItem
  showBreakdown: boolean
  onResultClick: (item: BetsTableItem) => void
}) {
  const { match, row, championTeam } = item
  const { entry, resultStatus, points } = row
  const isChampionBet = championTeam != null
  const teamName = championTeam
    ? getTeamDisplayName(championTeam.shortName, championTeam.name)
    : ''

  const breakdown = useMemo(() => {
    if (isChampionBet || !showBreakdown || !match || resultStatus === 'pending') {
      return null
    }

    return buildBetScoreBreakdown(
      match,
      entry.homeScore,
      entry.awayScore,
      entry.winnerPick,
    )
  }, [entry.awayScore, entry.homeScore, entry.winnerPick, isChampionBet, match, resultStatus, showBreakdown])

  const actualScore =
    match?.status === 'finished' &&
    match.score.home != null &&
    match.score.away != null
      ? `${match.score.home}×${match.score.away}`
      : null

  const showChampionBreakdown = isChampionBet && showBreakdown && resultStatus === 'exact'
  const spansFullWidth =
    isChampionBet || (showBreakdown ? breakdown !== null || showChampionBreakdown : true)

  return (
    <article
      className={`flex min-w-0 w-full max-w-full flex-col rounded-xl border border-slate-700/40 bg-pitch-950/50 p-3 ${
        spansFullWidth ? 'sm:col-span-2' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {formatRankingStatMatchLabel(item)}
          </p>
          {match?.utcDate && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {isChampionBet && resultStatus === 'pending'
                ? `Final em ${new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(match.utcDate))}`
                : new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(match.utcDate))}
            </p>
          )}
        </div>
        <BetResultBadge
          points={points}
          resultStatus={resultStatus}
          className="shrink-0 text-xs"
          onClick={
            !isChampionBet && resultStatus !== 'pending'
              ? () => onResultClick(item)
              : undefined
          }
        />
      </div>

      <div
        className={`mt-2.5 grid gap-2 ${
          resultStatus !== 'pending' ? 'grid-cols-2 sm:grid-cols-1' : 'grid-cols-1'
        }`}
      >
        <div className="min-w-0 rounded-lg border border-slate-700/30 bg-pitch-900/30 px-2.5 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Palpite</p>
          <div className="mt-1">
            {championTeam ? (
              <div className="flex items-center gap-2">
                <TeamCrest
                  crest={championTeam.crest}
                  name={teamName}
                  size="sm"
                  className="rounded-lg bg-pitch-950/50 p-0.5"
                />
                <span className="text-sm font-semibold text-white">{teamName}</span>
              </div>
            ) : (
              <BetScoreWithOutcome
                homeScore={entry.homeScore}
                awayScore={entry.awayScore}
                winnerPick={entry.winnerPick}
                match={match}
                showBetOutcome={false}
                layout="inline"
              />
            )}
          </div>
        </div>

        {resultStatus !== 'pending' && (
          <div className="min-w-0 rounded-lg border border-slate-700/30 bg-pitch-900/30 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {isChampionBet ? 'Pontuação' : 'Resultado'}
            </p>
            <div className="mt-1">
              {isChampionBet ? (
                <span className="text-sm font-bold tabular-nums text-gold-400">
                  {resultStatus === 'exact' ? `${CHAMPION_BET_POINTS} pts` : '0 pts'}
                </span>
              ) : actualScore ? (
                <span className="inline-flex rounded-lg border border-slate-600/50 bg-pitch-950 px-2.5 py-1 text-sm font-bold tabular-nums text-slate-200">
                  {actualScore.replace('×', ' x ')}
                </span>
              ) : (
                <span className="text-xs text-slate-500">—</span>
              )}
            </div>
          </div>
        )}
      </div>

      {showChampionBreakdown && <ChampionBetBreakdown />}

      {breakdown && breakdown.hits.length > 0 && (
        <ul className="mt-2.5 grid grid-cols-1 gap-2">
          {breakdown.hits.map((hit) => (
            <li
              key={hit.title}
              className="flex items-start justify-between gap-2 rounded-lg border border-slate-700/30 bg-pitch-900/40 px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-300">{hit.title}</p>
                <p className="mt-0.5 break-words text-[11px] leading-snug text-slate-500">
                  {hit.description}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${resultClasses[hit.tone]}`}
              >
                +{hit.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

interface RankingStatModalContentProps {
  selection: RankingStatSelection
  onClose: () => void
}

function RankingStatModalContent({ selection, onClose }: RankingStatModalContentProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [breakdownItem, setBreakdownItem] = useState<BetsTableItem | null>(null)

  const loadItems = useCallback(async () => {
    const itemsByPerson = await loadParticipantBetItemsMap()
    return resolveRankingStatItems(selection, itemsByPerson)
  }, [selection])

  const { data, isLoading, error, reload } = useAsyncResource(loadItems, [selection])
  const items = data ?? []

  useEffect(() => {
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
  }, [onClose])

  const label = RANKING_STAT_LABELS[selection.kind]
  const description = RANKING_STAT_DESCRIPTIONS[selection.kind]
  const showBreakdown =
    selection.kind === 'points' || selection.kind === 'exact' || selection.kind === 'partial'
  const totalPoints = items.reduce((sum, item) => sum + (item.row.points ?? 0), 0)

  return (
    <>
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
          className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-pitch-900 shadow-2xl shadow-black/40"
        >
          <div className="border-b border-slate-700/40 px-5 py-4">
            <h2 id={titleId} className="text-lg font-bold text-white">
              {label} — {selection.displayName}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-slate-400">
              {description}
            </p>
            <p className="mt-2 text-sm font-semibold tabular-nums text-gold-400">
              {formatSelectionValueLabel(selection)}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading && <RankingStatModalSkeleton />}
            {error && (
              <ErrorState
                message={error.message}
                statusCode={error.statusCode}
                onRetry={() => reload(true)}
              />
            )}
            {!isLoading && !error && items.length === 0 && (
              <p className="rounded-xl border border-slate-700/40 bg-pitch-950/50 p-4 text-sm text-slate-400">
                Nenhum palpite encontrado para este filtro.
              </p>
            )}
            {!isLoading && !error && items.length > 0 && (
              <div className={`grid min-w-0 gap-3 ${items.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                {items.map((item) => (
                  <RankingStatBetCard
                    key={item.row.entry.receiptId}
                    item={item}
                    showBreakdown={showBreakdown}
                    onResultClick={setBreakdownItem}
                  />
                ))}
              </div>
            )}
          </div>

          {!isLoading && !error && selection.kind === 'points' && items.length > 0 && (
            <div className="border-t border-slate-700/40 bg-pitch-950/30 px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Total exibido</span>
                <span className="text-lg font-bold tabular-nums text-gold-400">{totalPoints} pts</span>
              </div>
            </div>
          )}

          <div className="border-t border-slate-700/40 bg-pitch-950/40 px-5 py-4">
            <Button type="button" variant="gold" className="w-full" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>

      <BetScoreBreakdownModal item={breakdownItem} onClose={() => setBreakdownItem(null)} />
    </>
  )
}

export function RankingStatModal({ selection, onClose }: RankingStatModalProps) {
  if (!selection) return null

  return (
    <RankingStatModalContent
      key={`${selection.personNameKey}-${selection.kind}`}
      selection={selection}
      onClose={onClose}
    />
  )
}
