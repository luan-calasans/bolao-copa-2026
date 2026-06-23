import {
  hasValidPersonName,
  sanitizePersonNameInput,
  personNameContainsDigits,
  PERSON_NAME_NO_DIGITS_MESSAGE,
} from '../../utils/betValidation'
import { Button } from '../ui/Button'
import { ChampionTeamPicker } from './ChampionTeamPicker'
import type { ApiTeamDetail } from '../../models/api.types'
import { useState } from 'react'

interface ChampionBetFormProps {
  teams: ApiTeamDetail[]
  personName: string
  selectedTeamId: number | null
  validationError: string | null
  isSubmitting: boolean
  canPlaceBet: boolean
  betBlockedMessage: string | null
  onPersonNameChange: (value: string) => void
  onTeamSelect: (teamId: number) => void
  onConfirm: () => void
  isPersonNameLocked?: boolean
}

export function ChampionBetForm({
  teams,
  personName,
  selectedTeamId,
  validationError,
  isSubmitting,
  canPlaceBet,
  betBlockedMessage,
  onPersonNameChange,
  onTeamSelect,
  onConfirm,
  isPersonNameLocked = false,
}: ChampionBetFormProps) {
  const [showNameDigitsWarning, setShowNameDigitsWarning] = useState(false)

  function handlePersonNameChange(rawValue: string) {
    if (personNameContainsDigits(rawValue)) {
      setShowNameDigitsWarning(true)
    } else {
      setShowNameDigitsWarning(false)
    }

    onPersonNameChange(sanitizePersonNameInput(rawValue))
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-pitch-800/40 p-5 sm:p-6">
      {betBlockedMessage && (
        <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {betBlockedMessage}
        </p>
      )}

      <div className="mb-6">
        <label htmlFor="champion-person-name" className="mb-2 block text-sm font-medium text-slate-300">
          Seu nome no bolão <span className="text-red-400">*</span>
        </label>
        {isPersonNameLocked ? (
          <p
            id="champion-person-name"
            className="w-full rounded-xl border border-slate-600/50 bg-pitch-900/80 px-4 py-3 text-base text-white"
          >
            {personName}
          </p>
        ) : (
          <input
            id="champion-person-name"
            type="text"
            value={personName}
            onChange={(event) => handlePersonNameChange(event.target.value)}
            placeholder="Digite seu nome"
            maxLength={80}
            autoComplete="name"
            disabled={!canPlaceBet}
            aria-invalid={showNameDigitsWarning}
            className={`w-full rounded-xl border bg-pitch-900/80 px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none transition focus:ring-1 disabled:opacity-60 ${
              showNameDigitsWarning
                ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                : 'border-slate-600/50 focus:border-gold-500/60 focus:ring-gold-500/30'
            }`}
          />
        )}
        {showNameDigitsWarning && (
          <p className="mt-2 text-sm text-red-400">{PERSON_NAME_NO_DIGITS_MESSAGE}</p>
        )}
      </div>

      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-slate-300">
          Quem será o campeão? <span className="text-red-400">*</span>
        </p>
        <ChampionTeamPicker
          teams={teams}
          selectedTeamId={selectedTeamId}
          disabled={!canPlaceBet}
          onSelect={onTeamSelect}
        />
      </div>

      {validationError && (
        <p className="mb-4 text-sm text-red-400" role="alert">
          {validationError}
        </p>
      )}

      <Button
        type="button"
        variant="gold"
        className="w-full"
        disabled={!canPlaceBet || isSubmitting || !hasValidPersonName(personName) || selectedTeamId == null}
        onClick={onConfirm}
      >
        {isSubmitting ? 'Salvando...' : 'Confirmar palpite de campeão'}
      </Button>
    </div>
  )
}
