import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Bet } from '../models/bet'
import type { Match } from '../models/match'
import type { MatchBetEntry } from '../models/matchBet'
import type { WinnerPick } from '../models/winnerPick'
import type { Receipt } from '../models/receipt'
import { useAiPrediction } from '../hooks/useAiPrediction'
import type { AiPrediction } from '../models/aiPrediction'
import { getBetsByMatchId, saveBetAndReceipt } from '../services/betStorageService'
import { showToast } from '../lib/toast'
import {
  getBetSubmitSuccessMessage,
} from '../utils/betPickToast'
import {
  fetchMatchById,
  fetchWorldCupMatchesBundle,
  findWorldCupMatchById,
} from '../services/matchService'
import {
  isBetComplementable,
  toBetComplementFields,
  validateBetComplement,
} from '../utils/betComplement'
import {
  clampBetScore,
  getMinBetScores,
  hasBetScorePick,
  hasValidPersonName,
  validateBetContent,
  validateBetScores,
  validatePersonName,
} from '../utils/betValidation'
import { getFriendlyErrorMessage, toLoadError, type LoadError } from '../utils/errorMessages'
import { generateReceiptId } from '../utils/idGenerator'
import { getBetBlockedMessage } from '../utils/matchStatus'
import { normalizePersonNameKey } from '../utils/participantKey'
import { formatPersonNameForStorage } from '../../shared/personNameFormat.js'
import { isValidWinnerPick } from '../utils/winnerPickValidation'
import { useParticipant } from '../hooks/useParticipant'

const MATCH_REFRESH_MS = 60_000

interface FormSnapshot {
  personName: string
  winnerPick: WinnerPick | null
  homeScore: number | null
  awayScore: number | null
}

function isSameFormSnapshot(current: FormSnapshot, baseline: FormSnapshot): boolean {
  return (
    current.personName === baseline.personName &&
    current.winnerPick === baseline.winnerPick &&
    current.homeScore === baseline.homeScore &&
    current.awayScore === baseline.awayScore
  )
}

function findExistingBetForName(bets: MatchBetEntry[], personName: string): MatchBetEntry | null {
  const key = normalizePersonNameKey(personName)
  if (!key) return null

  return bets.find((bet) => normalizePersonNameKey(bet.personName) === key) ?? null
}

export interface BetViewModelState {
  match: Match | null
  betCount: number
  personName: string
  winnerPick: WinnerPick | null
  homeScore: number | null
  awayScore: number | null
  minHomeScore: number
  minAwayScore: number
  isLoading: boolean
  isReloading: boolean
  error: LoadError | null
  betBlockedMessage: string | null
  isSubmitting: boolean
  validationError: string | null
  aiPrediction: AiPrediction | null
  isAiLoading: boolean
  aiError: string | null
  canRequestAi: boolean
  canPlaceBet: boolean
  isFormDirty: boolean
  complementMode: 'none' | 'add-winner' | 'add-score' | 'complete'
  isScoreLocked: boolean
  isWinnerLocked: boolean
}

export interface BetViewModelActions {
  setPersonName: (value: string) => void
  setWinnerPick: (value: WinnerPick | null) => void
  setHomeScore: (value: number) => void
  setAwayScore: (value: number) => void
  clearScorePick: () => void
  confirmBet: () => void
  requestAiPrediction: () => void
  applyAiPrediction: () => void
  resetForm: () => void
  reload: (options?: { silent?: boolean }) => void
}

export function useBetViewModel(matchId: number): BetViewModelState & BetViewModelActions {
  const navigate = useNavigate()
  const { participant } = useParticipant()
  const [match, setMatch] = useState<Match | null>(null)
  const [betCount, setBetCount] = useState(0)
  const [matchBets, setMatchBets] = useState<MatchBetEntry[]>([])
  const [personNameDraft, setPersonNameDraft] = useState('')
  const personName = participant?.personName ?? personNameDraft
  const [winnerPick, setWinnerPick] = useState<WinnerPick | null>(null)
  const [homeScore, setHomeScore] = useState<number | null>(null)
  const [awayScore, setAwayScore] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [error, setError] = useState<LoadError | null>(null)
  const [betBlockedMessage, setBetBlockedMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [formBaseline, setFormBaseline] = useState<FormSnapshot | null>(null)
  const personNameRef = useRef(personName)

  useEffect(() => {
    personNameRef.current = personName
  }, [personName])

  const { aiPrediction, isAiLoading, aiError, canRequestAi, requestAiPrediction } = useAiPrediction(
    match?.id ?? null,
  )

  const minHomeScore = match ? getMinBetScores(match).home : 0
  const minAwayScore = match ? getMinBetScores(match).away : 0

  const existingBet = useMemo(
    () => (hasValidPersonName(personName) ? findExistingBetForName(matchBets, personName) : null),
    [personName, matchBets],
  )
  const existingHasScore = existingBet
    ? hasBetScorePick(existingBet.homeScore, existingBet.awayScore)
    : false
  const existingHasWinner = existingBet ? isValidWinnerPick(existingBet.winnerPick) : false
  const isScoreLocked = existingHasScore
  const isWinnerLocked = existingHasWinner
  const complementMode = !existingBet
    ? 'none'
    : !isBetComplementable(existingBet)
      ? 'complete'
      : existingHasScore
        ? 'add-winner'
        : 'add-score'

  const applyExistingBetToForm = useCallback((bet: MatchBetEntry) => {
    const hasScore = hasBetScorePick(bet.homeScore, bet.awayScore)
    const hasWinner = isValidWinnerPick(bet.winnerPick)

    setHomeScore(hasScore ? (bet.homeScore ?? null) : null)
    setAwayScore(hasScore ? (bet.awayScore ?? null) : null)
    setWinnerPick(hasWinner ? (bet.winnerPick ?? null) : null)
    setFormBaseline({
      personName: bet.personName?.trim() ?? '',
      winnerPick: hasWinner ? (bet.winnerPick ?? null) : null,
      homeScore: hasScore ? (bet.homeScore ?? null) : null,
      awayScore: hasScore ? (bet.awayScore ?? null) : null,
    })
  }, [])

  const applyLoadedMatch = useCallback((loadedMatch: Match, resetScores: boolean) => {
    const min = getMinBetScores(loadedMatch)
    setMatch(loadedMatch)
    setBetBlockedMessage(getBetBlockedMessage(loadedMatch))

    if (resetScores) {
      setPersonNameDraft('')
      setWinnerPick(null)
      setHomeScore(null)
      setAwayScore(null)
      setFormBaseline({
        personName: '',
        winnerPick: null,
        homeScore: null,
        awayScore: null,
      })
      return
    }

    setHomeScore((current) => (current === null ? null : clampBetScore(current, min.home)))
    setAwayScore((current) => (current === null ? null : clampBetScore(current, min.away)))
  }, [])

  const syncExistingBetForm = useCallback(
    (bets: MatchBetEntry[], name: string) => {
      if (!hasValidPersonName(name)) return

      const found = findExistingBetForName(bets, name)
      if (found) {
        applyExistingBetToForm(found)
      }
    },
    [applyExistingBetToForm],
  )

  const initializeFormForName = useCallback(
    (bets: MatchBetEntry[], name: string) => {
      if (!hasValidPersonName(name)) return

      const found = findExistingBetForName(bets, name)
      if (found) {
        applyExistingBetToForm(found)
        return
      }

      setWinnerPick(null)
      setHomeScore(null)
      setAwayScore(null)
      setFormBaseline({
        personName: name,
        winnerPick: null,
        homeScore: null,
        awayScore: null,
      })
    },
    [applyExistingBetToForm],
  )

  const loadMatchData = useCallback(
    async (resetScores = true, forceRefresh = false) => {
      const options = forceRefresh ? { force: true as const } : undefined
      const [bundle, loadedBets] = await Promise.all([
        fetchWorldCupMatchesBundle(options),
        getBetsByMatchId(matchId, options),
      ])

      const loadedMatch =
        findWorldCupMatchById(matchId, bundle) ?? (await fetchMatchById(matchId, options))

      if (!loadedMatch) {
        throw new Error('Jogo não encontrado.')
      }

      setBetCount(loadedBets.length)
      setMatchBets(loadedBets)
      applyLoadedMatch(loadedMatch, resetScores)

      if (resetScores) {
        if (participant?.personName) {
          initializeFormForName(loadedBets, participant.personName)
        }
      } else {
        syncExistingBetForm(loadedBets, personNameRef.current)
      }

      return loadedMatch
    },
    [applyLoadedMatch, initializeFormForName, matchId, participant, syncExistingBetForm],
  )

  const silentReload = useCallback(async () => {
    setIsReloading(true)

    try {
      await loadMatchData(false, true)
    } catch {
      // Mantém dados atuais em refresh silencioso.
    } finally {
      setIsReloading(false)
    }
  }, [loadMatchData])

  const reload = useCallback(
    (options?: { silent?: boolean }) => {
      if (options?.silent) {
        void silentReload()
        return
      }

      setIsLoading(true)
      setError(null)

      void loadMatchData(false, true)
        .catch((err) => {
          setError(toLoadError(err))
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [loadMatchData, silentReload],
  )

  useEffect(() => {
    let cancelled = false

    async function loadMatch() {
      setIsLoading(true)
      setError(null)
      setBetBlockedMessage(null)
      setValidationError(null)

      try {
        await loadMatchData(true)

        if (cancelled) return
      } catch (err) {
        if (!cancelled) {
          setError(toLoadError(err))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadMatch()

    return () => {
      cancelled = true
    }
  }, [loadMatchData])

  useEffect(() => {
    if (isLoading || error || !match) {
      return
    }

    const intervalId = window.setInterval(() => {
      void silentReload()
    }, MATCH_REFRESH_MS)

    return () => window.clearInterval(intervalId)
  }, [isLoading, error, match, silentReload])

  const setPersonNameSafe = useCallback(
    (value: string) => {
      setPersonNameDraft(value)
      setValidationError(null)

      if (!hasValidPersonName(value)) {
        setWinnerPick(null)
        setHomeScore(null)
        setAwayScore(null)
        setFormBaseline({
          personName: '',
          winnerPick: null,
          homeScore: null,
          awayScore: null,
        })
        return
      }

      syncExistingBetForm(matchBets, value)
    },
    [matchBets, syncExistingBetForm],
  )

  const setWinnerPickSafe = useCallback(
    (value: WinnerPick | null) => {
      if (isWinnerLocked) return
      setWinnerPick(value)
      setValidationError(null)
    },
    [isWinnerLocked],
  )

  const setHomeScoreSafe = useCallback(
    (value: number) => {
      if (isScoreLocked) return
      setHomeScore(clampBetScore(value, minHomeScore))
      setAwayScore((current) => (current === null ? minAwayScore : current))
      setValidationError(null)
    },
    [isScoreLocked, minHomeScore, minAwayScore],
  )

  const setAwayScoreSafe = useCallback(
    (value: number) => {
      if (isScoreLocked) return
      setAwayScore(clampBetScore(value, minAwayScore))
      setHomeScore((current) => (current === null ? minHomeScore : current))
      setValidationError(null)
    },
    [isScoreLocked, minHomeScore, minAwayScore],
  )

  const clearScorePick = useCallback(() => {
    if (isScoreLocked) return
    setHomeScore(null)
    setAwayScore(null)
    setValidationError(null)
  }, [isScoreLocked])

  const confirmBet = useCallback(() => {
    if (!match) return

    const blockedMessage = getBetBlockedMessage(match)
    if (blockedMessage) {
      setValidationError(blockedMessage)
      return
    }

    const nameError = validatePersonName(personName)
    if (nameError) {
      setValidationError(nameError)
      return
    }

    if (complementMode === 'complete') {
      setValidationError('Você já registrou um palpite completo para este jogo.')
      return
    }

    if (existingBet) {
      const complementError = validateBetComplement(
        toBetComplementFields(existingBet),
        toBetComplementFields({ homeScore, awayScore, winnerPick }),
      )
      if (complementError) {
        setValidationError(complementError)
        return
      }
    } else {
      const contentError = validateBetContent(winnerPick, homeScore, awayScore)
      if (contentError) {
        setValidationError(contentError)
        return
      }
    }

    if (hasBetScorePick(homeScore, awayScore)) {
      const scoreError = validateBetScores(match, homeScore!, awayScore!)
      if (scoreError) {
        setValidationError(scoreError)
        return
      }
    }

    setValidationError(null)
    setIsSubmitting(true)

    const createdAt = existingBet?.createdAt ?? new Date().toISOString()
    const formattedName = formatPersonNameForStorage(personName)
    const bet: Bet = {
      matchId: match.id,
      homeScore: homeScore ?? null,
      awayScore: awayScore ?? null,
      winnerPick: winnerPick ?? undefined,
      personName: formattedName,
      match,
      createdAt,
    }

    const receipt: Receipt = {
      id: generateReceiptId(),
      bet,
      generatedAt: new Date().toISOString(),
    }

    void (async () => {
      try {
        const receiptId = await saveBetAndReceipt(bet, receipt)
        showToast(
          getBetSubmitSuccessMessage(complementMode, winnerPick, homeScore, awayScore),
        )
        navigate(`/comprovante/${receiptId}`)
      } catch (err) {
        const message = getFriendlyErrorMessage(err)
        setValidationError(message)
        showToast(message, 'error')
        setIsSubmitting(false)
      }
    })()
  }, [match, personName, winnerPick, homeScore, awayScore, navigate, complementMode, existingBet])

  const applyAiPrediction = useCallback(() => {
    if (!aiPrediction || isScoreLocked) return

    setHomeScore(clampBetScore(aiPrediction.homeScore, minHomeScore))
    setAwayScore(clampBetScore(aiPrediction.awayScore, minAwayScore))
    setValidationError(null)
  }, [aiPrediction, minHomeScore, minAwayScore, isScoreLocked])

  const resetForm = useCallback(() => {
    if (!formBaseline) return

    if (!participant) {
      setPersonNameDraft(formBaseline.personName)
    }
    setWinnerPick(formBaseline.winnerPick)
    setHomeScore(formBaseline.homeScore)
    setAwayScore(formBaseline.awayScore)
    setValidationError(null)
    showToast('Alterações descartadas.', 'info')
  }, [formBaseline, participant])

  const isFormDirty =
    formBaseline !== null &&
    !isSameFormSnapshot({ personName, winnerPick, homeScore, awayScore }, formBaseline)

  const canPlaceBet = Boolean(match && !betBlockedMessage)

  return {
    match,
    betCount,
    personName,
    winnerPick,
    homeScore,
    awayScore,
    minHomeScore,
    minAwayScore,
    isLoading,
    isReloading,
    error,
    betBlockedMessage,
    isSubmitting,
    validationError,
    aiPrediction,
    isAiLoading,
    aiError,
    canRequestAi,
    canPlaceBet,
    isFormDirty,
    complementMode,
    isScoreLocked,
    isWinnerLocked,
    setPersonName: setPersonNameSafe,
    setWinnerPick: setWinnerPickSafe,
    setHomeScore: setHomeScoreSafe,
    setAwayScore: setAwayScoreSafe,
    clearScorePick,
    confirmBet,
    requestAiPrediction,
    applyAiPrediction,
    resetForm,
    reload,
  }
}
