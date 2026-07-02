import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trophy } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { APP_ROUTES } from '../../routes/routePaths'
import { fetchRanking, type RankingRow } from '../../services/rankingService'
import { getParticipantBetsPathFromKey } from '../../utils/participantRoutes'
import {
  getPodiumNameClass,
  getPodiumRankClass,
  type PodiumRank,
} from '../../utils/podiumPlacement'
import { sortRankingRows } from '../../utils/rankingTableSort'
import { PodiumTrophyIcon } from '../ui/PodiumTrophyIcon'

const TOP_RANKING_LIMIT = 3

interface TopRankingEntry {
  rank: PodiumRank
  row: RankingRow
}

function TopRankingRow({ rank, row }: TopRankingEntry) {
  const isFirst = rank === 1

  return (
    <Link
      to={getParticipantBetsPathFromKey(row.personNameKey)}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition hover:border-slate-500/60 hover:bg-pitch-700/30 ${
        isFirst
          ? 'border-gold-500/40 bg-gradient-to-r from-gold-500/10 to-transparent'
          : 'border-slate-700/40 bg-pitch-950/40'
      }`}
      title={`Ver palpites de ${row.displayName}`}
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700/50 bg-pitch-900/70 text-base font-black tabular-nums ${getPodiumRankClass(
          rank,
        )}`}
        aria-hidden="true"
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`flex min-w-0 items-center gap-1.5 font-semibold ${getPodiumNameClass(rank)}`}
        >
          <PodiumTrophyIcon rank={rank} size="sm" />
          <span className="truncate">{row.displayName}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {row.exactHits} exatos · {row.partialHits} parciais
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xl font-black tabular-nums text-gold-400">{row.totalPoints}</p>
        <p className="-mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          pts
        </p>
      </div>
    </Link>
  )
}

interface TopRankingModalProps {
  entries: TopRankingEntry[]
  onClose: () => void
}

function TopRankingModal({ entries, onClose }: TopRankingModalProps) {
  const titleId = useId()
  const descriptionId = useId()

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

  return createPortal(
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-pitch-900 shadow-2xl shadow-black/40"
      >
        <div className="relative overflow-hidden border-b border-slate-700/40 bg-gradient-to-br from-gold-500/15 via-pitch-900 to-pitch-900 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 text-gold-400">
              <Trophy className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold text-white">
                Top 3 do Ranking
              </h2>
              <p id={descriptionId} className="mt-0.5 text-sm text-slate-400">
                Os líderes do bolão
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-5 py-5">
          {entries.map(({ rank, row }) => (
            <TopRankingRow key={row.personNameKey} rank={rank} row={row} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-700/40 bg-pitch-950/40 px-5 py-4">
          <Link
            to={APP_ROUTES.ranking}
            onClick={onClose}
            className="rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-2.5 text-center text-sm font-semibold text-gold-400 transition hover:bg-gold-500/20"
          >
            Ver ranking
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-600/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-pitch-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function TopRankingFab() {
  const { pathname } = useLocation()
  const isRankingPage = pathname === APP_ROUTES.ranking

  const loadTopRanking = useCallback(async () => {
    const data = await fetchRanking()
    return sortRankingRows(data.ranking, null).slice(0, TOP_RANKING_LIMIT)
  }, [])

  const { data: topRanking, isLoading, error } = useAsyncResource(loadTopRanking, [])
  const [isOpen, setIsOpen] = useState(false)

  const entries = useMemo<TopRankingEntry[]>(() => {
    if (!topRanking?.length) return []

    return topRanking.map((row, index) => ({
      rank: (index + 1) as PodiumRank,
      row,
    }))
  }, [topRanking])

  useEffect(() => {
    if (entries.length === 0 || isRankingPage) {
      setIsOpen(false)
    }
  }, [entries.length, isRankingPage])

  if (isRankingPage || isLoading || error || entries.length === 0) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Ver top 3 do ranking"
        title="Top 3 do ranking"
        className="pointer-events-auto grid h-14 w-14 shrink-0 cursor-pointer place-items-center rounded-full border border-gold-500/40 bg-pitch-900/95 text-gold-400 shadow-lg shadow-black/30 backdrop-blur-md transition hover:border-gold-500/70 hover:bg-pitch-800 hover:text-gold-300 sm:h-16 sm:w-16"
      >
        <Trophy
          className="h-[1.375rem] w-[1.375rem] sm:h-7 sm:w-7"
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {isOpen && <TopRankingModal entries={entries} onClose={() => setIsOpen(false)} />}
    </>
  )
}
