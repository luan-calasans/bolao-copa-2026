import { useCallback, useMemo, useState } from 'react'
import type { KnockoutBracket, KnockoutMatch } from '../models/knockout'
import {
  applySimulatorPicks,
  applySimulatorPick,
  getSimulatedChampion,
  isMatchPickable,
  pruneDownstreamScores,
  resolveSimulatedWinner,
  type SimulatorPickSide,
  type SimulatorPicks,
  type SimulatorScores,
} from '../utils/knockoutSimulator'
import { useKnockoutViewModel } from './useKnockoutViewModel'

export function useKnockoutSimulatorViewModel() {
  const { bracket: baseBracket, isLoading, error, isEmpty, reload } = useKnockoutViewModel()
  const [picks, setPicks] = useState<SimulatorPicks>({})
  const [scores, setScores] = useState<SimulatorScores>({})

  const simulatedBracket = useMemo<KnockoutBracket | null>(() => {
    if (!baseBracket) return null
    return applySimulatorPicks(baseBracket, picks, scores)
  }, [baseBracket, picks, scores])

  const champion = useMemo(
    () => (simulatedBracket ? getSimulatedChampion(simulatedBracket, picks, scores) : null),
    [simulatedBracket, picks, scores],
  )

  const canPickMatch = useCallback(
    (match: KnockoutMatch) => isMatchPickable(match, picks),
    [picks],
  )

  const getWinner = useCallback(
    (match: KnockoutMatch) => resolveSimulatedWinner(match, picks, scores),
    [picks, scores],
  )

  const pickWinner = useCallback(
    (matchKey: string, side: SimulatorPickSide) => {
      if (!baseBracket) return

      setPicks((previous) => applySimulatorPick(baseBracket, previous, matchKey, side))
      setScores((previous) => pruneDownstreamScores(baseBracket, previous, matchKey))
    },
    [baseBracket],
  )

  const setScore = useCallback((matchKey: string, home: number | null, away: number | null) => {
    setScores((previous) => {
      if (home == null && away == null) {
        const next = { ...previous }
        delete next[matchKey]
        return next
      }

      const current = previous[matchKey]
      const nextHome = home ?? current?.home ?? null
      const nextAway = away ?? current?.away ?? null

      return {
        ...previous,
        [matchKey]: { home: nextHome, away: nextAway },
      }
    })
  }, [])

  const resetSimulation = useCallback(() => {
    setPicks({})
    setScores({})
  }, [])

  const hasPicks = Object.keys(picks).length > 0 || Object.keys(scores).length > 0

  return {
    bracket: simulatedBracket,
    baseBracket,
    isLoading,
    error,
    isEmpty,
    reload,
    picks,
    scores,
    pickWinner,
    setScore,
    resetSimulation,
    hasPicks,
    champion,
    isMatchPickable: canPickMatch,
    getWinner,
  }
}
