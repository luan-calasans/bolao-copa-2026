import { useCallback, useEffect, useState } from 'react'
import type { Match } from '../models/match'
import type { MatchHighlightImages } from '../models/matchHighlight'
import { fetchMatchHighlightImages } from '../services/sportsdbService'

const LIVE_REFRESH_MS = 60_000

interface UseMatchHighlightsResult {
  images: MatchHighlightImages | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
}

export function useMatchHighlights(match: Match | null, enabled = true): UseMatchHighlightsResult {
  const [images, setImages] = useState<MatchHighlightImages | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shouldLoadHighlights = Boolean(
    enabled && match && (match.isLive || match.status === 'finished'),
  )

  const silentReload = useCallback(async () => {
    if (!match || !shouldLoadHighlights) {
      return
    }

    setIsRefreshing(true)

    try {
      const loadedImages = await fetchMatchHighlightImages(match)
      if (loadedImages) {
        setImages(loadedImages)
      }
    } catch {
      // Mantém imagens atuais em refresh silencioso ao vivo.
    } finally {
      setIsRefreshing(false)
    }
  }, [match, shouldLoadHighlights])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!match || !shouldLoadHighlights) {
        if (!cancelled) {
          setImages(null)
          setError(null)
          setIsLoading(false)
          setIsRefreshing(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const loadedImages = await fetchMatchHighlightImages(match)

        if (cancelled) {
          return
        }

        setImages(loadedImages)
      } catch {
        if (cancelled) {
          return
        }

        setError('Não foi possível carregar as imagens desta partida.')
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
  }, [match, shouldLoadHighlights])

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
    images,
    isLoading,
    isRefreshing,
    error,
  }
}
