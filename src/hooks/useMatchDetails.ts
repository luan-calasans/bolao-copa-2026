import { useCallback, useEffect, useState } from 'react'
import type { Match } from '../models/match'
import type { MatchDetails } from '../models/sportsdb.types'
import { fetchMatchDetails } from '../services/sportsdbService'

const LIVE_REFRESH_MS = 60_000

interface UseMatchDetailsResult {
  details: MatchDetails | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
}

export function useMatchDetails(match: Match | null): UseMatchDetailsResult {
  const [details, setDetails] = useState<MatchDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shouldLoadDetails = Boolean(match && (match.isLive || match.status === 'finished'))

  const silentReload = useCallback(async () => {
    if (!match || !shouldLoadDetails) {
      return
    }

    setIsRefreshing(true)

    try {
      const loadedDetails = await fetchMatchDetails(match)
      if (loadedDetails) {
        setDetails(loadedDetails)
      }
    } catch {
      // Mantém detalhes atuais em refresh silencioso ao vivo.
    } finally {
      setIsRefreshing(false)
    }
  }, [match, shouldLoadDetails])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!match || !shouldLoadDetails) {
        if (!cancelled) {
          setDetails(null)
          setError(null)
          setIsLoading(false)
          setIsRefreshing(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const loadedDetails = await fetchMatchDetails(match)

        if (cancelled) {
          return
        }

        setDetails(loadedDetails)
      } catch {
        if (cancelled) {
          return
        }

        setError('Não foi possível carregar os detalhes desta partida.')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [match, shouldLoadDetails])

  useEffect(() => {
    if (!match?.isLive) {
      return
    }

    const intervalId = window.setInterval(() => {
      void silentReload()
    }, LIVE_REFRESH_MS)

    return () => window.clearInterval(intervalId)
  }, [match?.isLive, silentReload])

  return {
    details,
    isLoading,
    isRefreshing,
    error,
  }
}
