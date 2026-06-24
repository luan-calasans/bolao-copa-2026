import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApiTeamDetail } from '../models/api.types'
import type { ChampionBetEntry, ChampionBetMeta } from '../models/championBet'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { fetchChampionBets, saveChampionBetAndReceipt } from '../services/championBetService'
import { fetchWorldCupTeams } from '../services/competitionService'
import { hasValidPersonName, validatePersonName } from '../utils/betValidation'
import { getFriendlyErrorMessage, type LoadError } from '../utils/errorMessages'
import { showToast } from '../lib/toast'
import { generateReceiptId } from '../utils/idGenerator'
import { normalizePersonNameKey } from '../utils/participantKey'
import { getTeamDisplayName } from '../utils/teamDisplay'
import { receiptPath } from '../routes/routePaths'
import { formatPersonNameForStorage } from '../../shared/personNameFormat.js'
import { useParticipant } from '../hooks/useParticipant'

interface ChampionBetData {
  teams: ApiTeamDetail[]
  meta: ChampionBetMeta
  bets: ChampionBetEntry[]
}

function sortTeams(teams: ApiTeamDetail[]): ApiTeamDetail[] {
  return [...teams].sort((a, b) =>
    getTeamDisplayName(a.shortName, a.name).localeCompare(
      getTeamDisplayName(b.shortName, b.name),
      'pt-BR',
    ),
  )
}

function findExistingChampionBetForName(
  bets: ChampionBetEntry[],
  personName: string,
): ChampionBetEntry | null {
  const key = normalizePersonNameKey(personName)
  if (!key) return null

  return bets.find((bet) => normalizePersonNameKey(bet.personName) === key) ?? null
}

export interface ChampionBetViewModelState {
  teams: ApiTeamDetail[]
  meta: ChampionBetMeta | null
  personName: string
  selectedTeamId: number | null
  existingBet: ChampionBetEntry | null
  isLoading: boolean
  error: LoadError | null
  isSubmitting: boolean
  validationError: string | null
  canPlaceBet: boolean
  betBlockedMessage: string | null
  isEmpty: boolean
}

export interface ChampionBetViewModelActions {
  setPersonName: (value: string) => void
  setSelectedTeamId: (teamId: number) => void
  confirmBet: () => void
  reload: (force?: boolean) => void
}

export function useChampionBetViewModel(): ChampionBetViewModelState & ChampionBetViewModelActions {
  const navigate = useNavigate()
  const { participant } = useParticipant()
  const [personName, setPersonNameState] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const loadData = useCallback(async (forceRefresh = false): Promise<ChampionBetData> => {
    const cacheOptions = forceRefresh ? { force: true } : undefined
    const [teamsResponse, championResponse] = await Promise.all([
      fetchWorldCupTeams(undefined, cacheOptions),
      fetchChampionBets(cacheOptions),
    ])

    return {
      teams: sortTeams(teamsResponse.teams ?? []),
      meta: championResponse.meta,
      bets: championResponse.bets,
    }
  }, [])

  const { data, isLoading, error, reload } = useAsyncResource(loadData, [])

  const teams = data?.teams ?? []
  const meta = data?.meta ?? null
  const bets = data?.bets ?? []

  const existingBet = useMemo(
    () =>
      hasValidPersonName(personName) ? findExistingChampionBetForName(bets, personName) : null,
    [personName, bets],
  )

  useEffect(() => {
    if (!participant?.personName) return
    setPersonNameState(participant.personName)
  }, [participant?.personName])

  const canPlaceBet = meta?.acceptingBets === true && existingBet == null
  const betBlockedMessage = existingBet
    ? 'Você já registrou seu palpite de campeão.'
    : (meta?.blockReason ?? null)

  const setPersonName = useCallback(
    (value: string) => {
      setPersonNameState(value)
      setValidationError(null)

      const found = hasValidPersonName(value) ? findExistingChampionBetForName(bets, value) : null
      if (found) {
        setSelectedTeamId(found.teamId)
      }
    },
    [bets],
  )

  const confirmBet = useCallback(async () => {
    const nameError = validatePersonName(personName)
    if (nameError) {
      setValidationError(nameError)
      return
    }

    if (selectedTeamId == null) {
      setValidationError('Escolha a seleção campeã.')
      return
    }

    if (!canPlaceBet) {
      setValidationError(betBlockedMessage ?? 'Não é possível registrar o palpite agora.')
      return
    }

    setValidationError(null)
    setIsSubmitting(true)

    try {
      const formattedName = formatPersonNameForStorage(personName)
      const createdAt = new Date().toISOString()
      const receiptId = generateReceiptId()

      const savedReceiptId = await saveChampionBetAndReceipt(
        {
          teamId: selectedTeamId,
          personName: formattedName,
          createdAt,
        },
        {
          id: receiptId,
          generatedAt: createdAt,
        },
      )

      navigate(receiptPath(savedReceiptId))
    } catch (submitError) {
      const message = getFriendlyErrorMessage(submitError)
      setValidationError(message)
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    betBlockedMessage,
    canPlaceBet,
    navigate,
    personName,
    selectedTeamId,
  ])

  const showLoading = isLoading && teams.length === 0
  const isEmpty = !isLoading && !error && teams.length === 0

  return {
    teams,
    meta,
    personName,
    setPersonName,
    selectedTeamId,
    setSelectedTeamId,
    existingBet,
    isLoading: showLoading,
    error,
    reload,
    isSubmitting,
    validationError,
    canPlaceBet,
    betBlockedMessage,
    confirmBet,
    isEmpty,
  }
}
