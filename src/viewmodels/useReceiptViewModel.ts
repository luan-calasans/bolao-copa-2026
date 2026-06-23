import { useEffect, useMemo, useState } from 'react'
import type { ChampionReceipt } from '../models/championBet'
import type { Receipt } from '../models/receipt'
import { getReceiptById } from '../services/betStorageService'
import { getChampionReceiptById } from '../services/championBetService'
import { normalizeCrestUrl } from '../utils/crestUrl'
import { toLoadError, type LoadError } from '../utils/errorMessages'

export type StoredReceipt =
  | { kind: 'match'; receipt: Receipt }
  | { kind: 'champion'; receipt: ChampionReceipt }

export interface ReceiptViewModelState {
  storedReceipt: StoredReceipt | null
  isLoading: boolean
  notFound: boolean
  error: LoadError | null
}

function normalizeReceipt(receipt: Receipt): Receipt {
  if (!receipt.bet.match) {
    return receipt
  }

  return {
    ...receipt,
    bet: {
      ...receipt.bet,
      match: {
        ...receipt.bet.match,
        homeTeam: {
          ...receipt.bet.match.homeTeam,
          crest: normalizeCrestUrl(receipt.bet.match.homeTeam.crest),
          isDefined:
            receipt.bet.match.homeTeam.isDefined ??
            (receipt.bet.match.homeTeam.id != null &&
              Boolean(receipt.bet.match.homeTeam.name?.trim())),
        },
        awayTeam: {
          ...receipt.bet.match.awayTeam,
          crest: normalizeCrestUrl(receipt.bet.match.awayTeam.crest),
          isDefined:
            receipt.bet.match.awayTeam.isDefined ??
            (receipt.bet.match.awayTeam.id != null &&
              Boolean(receipt.bet.match.awayTeam.name?.trim())),
        },
      },
    },
  }
}

export function useReceiptViewModel(receiptId: string): ReceiptViewModelState {
  const [storedReceipt, setStoredReceipt] = useState<StoredReceipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<LoadError | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadReceipt() {
      setIsLoading(true)
      setNotFound(false)
      setError(null)

      try {
        const matchReceipt = await getReceiptById(receiptId)

        if (cancelled) return

        if (matchReceipt) {
          setStoredReceipt({ kind: 'match', receipt: normalizeReceipt(matchReceipt) })
          return
        }

        const championReceipt = await getChampionReceiptById(receiptId)

        if (cancelled) return

        if (!championReceipt) {
          setStoredReceipt(null)
          setNotFound(true)
          return
        }

        setStoredReceipt({ kind: 'champion', receipt: championReceipt })
      } catch (err) {
        if (cancelled) return

        setStoredReceipt(null)
        setError(toLoadError(err))
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadReceipt()

    return () => {
      cancelled = true
    }
  }, [receiptId])

  return useMemo(
    () => ({
      storedReceipt,
      isLoading,
      notFound,
      error,
    }),
    [storedReceipt, isLoading, notFound, error],
  )
}
