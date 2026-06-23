import { useCallback } from 'react'
import { fetchRanking } from '../services/rankingService'
import type { RankingRow } from '../services/rankingService'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { SCORING_RULES, type ScoringRule } from '../utils/betScoring'
import type { LoadError } from '../utils/errorMessages'

interface RankingData {
  ranking: RankingRow[]
  rules: ScoringRule[]
  syncedAt: string | null
}

export interface RankingViewModelState {
  ranking: RankingRow[]
  rules: ScoringRule[]
  syncedAt: string | null
  isLoading: boolean
  error: LoadError | null
  isEmpty: boolean
  reload: (force?: boolean) => void
}

export function useRankingViewModel(): RankingViewModelState {
  const loadData = useCallback(async (forceRefresh = false): Promise<RankingData> => {
    const data = await fetchRanking(forceRefresh ? { force: true } : undefined)
    return {
      ranking: data.ranking,
      rules: data.rules.length > 0 ? data.rules : SCORING_RULES,
      syncedAt: data.syncedAt,
    }
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadData, [])

  const ranking = data?.ranking ?? []
  const rules = data?.rules ?? SCORING_RULES
  const syncedAt = data?.syncedAt ?? null
  const isEmpty = !isLoading && !error && ranking.length === 0

  return {
    ranking,
    rules,
    syncedAt,
    isLoading,
    error,
    isEmpty,
    reload,
  }
}
