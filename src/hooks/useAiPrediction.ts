import { useCallback, useState } from 'react'
import type { AiPrediction } from '../models/aiPrediction'
import { fetchAiPrediction } from '../services/aiPredictionService'
import { showToast } from '../lib/toast'
import { getFriendlyErrorMessage } from '../utils/errorMessages'
import { isSingleAiRequestPerPage } from '../utils/isLocalhost'

export function useAiPrediction(matchId: number | null) {
  const [aiPrediction, setAiPrediction] = useState<AiPrediction | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [hasRequested, setHasRequested] = useState(false)

  const singleRequestPerPage = isSingleAiRequestPerPage()
  const canRequestAi = !singleRequestPerPage || !hasRequested

  const requestAiPrediction = useCallback(() => {
    if (matchId == null || isAiLoading || !canRequestAi) return

    setHasRequested(true)
    setIsAiLoading(true)
    setAiError(null)

    void (async () => {
      try {
        const prediction = await fetchAiPrediction(matchId)
        setAiPrediction(prediction)
      } catch (err) {
        const message = getFriendlyErrorMessage(err)
        setAiError(message)
        showToast(message, 'error')
        setAiPrediction(null)
      } finally {
        setIsAiLoading(false)
      }
    })()
  }, [matchId, isAiLoading, canRequestAi])

  return {
    aiPrediction,
    isAiLoading,
    aiError,
    canRequestAi,
    requestAiPrediction,
  }
}
