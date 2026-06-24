import { useCallback, useState } from 'react'
import { deleteAdminBetByReceiptId, getAdminBets } from '../services/adminBetService'
import { showToast } from '../lib/toast'
import { getFriendlyErrorMessage, type LoadError } from '../utils/errorMessages'
import { useBetsListViewModel, type BetsMatchGroup } from './useBetsListViewModel'

export type { BetsMatchGroup as AdminBetsMatchGroup }

export interface AdminBetsViewModelState {
  groups: BetsMatchGroup[]
  totalBets: number
  totalExact: number
  totalPartial: number
  totalMissed: number
  isLoading: boolean
  error: LoadError | null
  isEmpty: boolean
  deletingReceiptId: string | null
  removeBet: (receiptId: string) => Promise<void>
  reload: (force?: boolean) => void
}

export function useAdminBetsViewModel(): AdminBetsViewModelState {
  const {
    groups,
    totalBets,
    totalExact,
    totalPartial,
    totalMissed,
    isLoading,
    error: loadError,
    isEmpty,
    reload,
    removeBetLocally,
  } = useBetsListViewModel({ fetchBets: getAdminBets })
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null)

  const removeBet = useCallback(
    async (receiptId: string) => {
      setDeletingReceiptId(receiptId)

      try {
        await deleteAdminBetByReceiptId(receiptId)
        removeBetLocally(receiptId)
        showToast('Palpite excluído.')
      } catch (err) {
        showToast(getFriendlyErrorMessage(err), 'error')
        throw err
      } finally {
        setDeletingReceiptId(null)
      }
    },
    [removeBetLocally],
  )

  return {
    groups,
    totalBets,
    totalExact,
    totalPartial,
    totalMissed,
    isLoading,
    error: loadError,
    isEmpty,
    deletingReceiptId,
    removeBet,
    reload,
  }
}
