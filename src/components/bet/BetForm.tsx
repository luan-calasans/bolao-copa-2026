import { useState } from 'react'
import type { Match } from '../../models/match'
import type { WinnerPick } from '../../models/winnerPick'
import { AlertModal } from '../ui/AlertModal'
import { Button } from '../ui/Button'
import { ScoreInput } from './ScoreInput'
import { WinnerPickSelector } from './WinnerPickSelector'
import { hasBetScorePick, hasValidPersonName, validateBetContent, sanitizePersonNameInput, personNameContainsDigits, PERSON_NAME_NO_DIGITS_MESSAGE } from '../../utils/betValidation'
import { formatWinnerPickLabel, getWinnerPickTextClass } from '../../utils/winnerPickDisplay'
import { isValidWinnerPick } from '../../utils/winnerPickValidation'

interface BetFormProps {
  match: Match
  personName: string
  winnerPick: WinnerPick | null
  homeScore: number | null
  awayScore: number | null
  minHomeScore: number
  minAwayScore: number
  validationError: string | null
  isSubmitting: boolean
  isFormDirty?: boolean
  complementMode?: 'none' | 'add-winner' | 'add-score' | 'complete'
  isScoreLocked?: boolean
  isWinnerLocked?: boolean
  onPersonNameChange: (value: string) => void
  onWinnerPickChange: (value: WinnerPick | null) => void
  onHomeScoreChange: (value: number) => void
  onAwayScoreChange: (value: number) => void
  onClearScorePick: () => void
  onConfirm: () => void
  onReset?: () => void
}

export function BetForm({
  match,
  personName,
  winnerPick,
  homeScore,
  awayScore,
  minHomeScore,
  minAwayScore,
  validationError,
  isSubmitting,
  isFormDirty = false,
  complementMode = 'none',
  isScoreLocked = false,
  isWinnerLocked = false,
  onPersonNameChange,
  onWinnerPickChange,
  onHomeScoreChange,
  onAwayScoreChange,
  onClearScorePick,
  onConfirm,
  onReset,
}: BetFormProps) {
  const [showNameRequiredModal, setShowNameRequiredModal] = useState(false)
  const [showContentRequiredModal, setShowContentRequiredModal] = useState(false)
  const [showNameDigitsWarning, setShowNameDigitsWarning] = useState(false)
  const hasScore = hasBetScorePick(homeScore, awayScore)
  const submitLabel =
    complementMode === 'add-winner'
      ? 'Salvar quem vence'
      : complementMode === 'add-score'
        ? 'Salvar placar'
        : 'Palpitar'

  function handlePalpitarClick() {
    if (!hasValidPersonName(personName)) {
      setShowNameRequiredModal(true)
      return
    }

    if (complementMode === 'complete') {
      return
    }

    if (complementMode === 'none' && validateBetContent(winnerPick, homeScore, awayScore)) {
      setShowContentRequiredModal(true)
      return
    }

    onConfirm()
  }

  function handlePersonNameChange(rawValue: string) {
    if (personNameContainsDigits(rawValue)) {
      setShowNameDigitsWarning(true)
    } else {
      setShowNameDigitsWarning(false)
    }

    onPersonNameChange(sanitizePersonNameInput(rawValue))
  }

  return (
    <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
      {match.isLive && (
        <p className="live-bet-notice mb-6 rounded-xl border border-brazil-green/30 bg-brazil-green/10 px-4 py-3 text-center text-sm text-emerald-200">
          O placar na partida pode mudar enquanto você registra o palpite.
        </p>
      )}

      <div className="mb-6">
        <label htmlFor="person-name" className="mb-2 block text-sm font-medium text-slate-300">
          Seu nome no bolão <span className="text-red-400">*</span>
        </label>
        <input
          id="person-name"
          type="text"
          value={personName}
          onChange={(event) => handlePersonNameChange(event.target.value)}
          placeholder="Digite seu nome"
          maxLength={80}
          autoComplete="name"
          required
          aria-invalid={showNameDigitsWarning}
          aria-describedby={showNameDigitsWarning ? 'person-name-digits-error' : undefined}
          className={`w-full rounded-xl border bg-pitch-900/80 px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none transition focus:ring-1 ${
            showNameDigitsWarning
              ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
              : 'border-slate-600/50 focus:border-gold-500/60 focus:ring-gold-500/30'
          }`}
        />
        {showNameDigitsWarning && (
          <p id="person-name-digits-error" className="mt-2 text-sm text-red-400">
            {PERSON_NAME_NO_DIGITS_MESSAGE}
          </p>
        )}
      </div>

      {complementMode === 'add-winner' && (
        <p className="mb-6 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-100">
          Você já registrou o placar deste jogo. Agora escolha quem vence (ou empate) para
          complementar seu palpite.
        </p>
      )}

      {complementMode === 'add-score' && (
        <p className="mb-6 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-100">
          Você já registrou quem vence neste jogo. Agora informe o placar previsto para complementar
          seu palpite.
        </p>
      )}

      {complementMode === 'complete' && (
        <p className="mb-6 rounded-xl border border-slate-600/50 bg-pitch-800/60 px-4 py-3 text-sm text-slate-300">
          Você já registrou um palpite completo para este jogo neste nome.
        </p>
      )}

      <WinnerPickSelector
        match={match}
        value={winnerPick}
        onChange={onWinnerPickChange}
        disabled={isWinnerLocked}
      />

      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-300">
          Placar previsto{isScoreLocked ? ' (registrado)' : ''}
        </p>
        {hasScore && !isScoreLocked && (
          <button
            type="button"
            onClick={onClearScorePick}
            className="cursor-pointer text-xs font-medium text-slate-400 transition hover:text-slate-200"
          >
            Limpar placar
          </button>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <ScoreInput
          value={homeScore}
          minScore={minHomeScore}
          onChange={onHomeScoreChange}
          team={match.homeTeam}
          disabled={isScoreLocked}
        />
        <ScoreInput
          value={awayScore}
          minScore={minAwayScore}
          onChange={onAwayScoreChange}
          team={match.awayTeam}
          disabled={isScoreLocked}
        />
      </div>

      <div className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4 text-center">
        <p className="text-sm text-slate-400">Seu palpite</p>
        {hasScore ? (
          <p className="text-3xl font-bold text-gold-400">
            {homeScore} × {awayScore}
          </p>
        ) : winnerPick && isValidWinnerPick(winnerPick) ? (
          <p className={`text-xl font-bold ${getWinnerPickTextClass(winnerPick)}`}>
            {formatWinnerPickLabel(match, winnerPick)}
          </p>
        ) : (
          <p className="text-lg text-slate-500">Escolha quem vence ou informe o placar</p>
        )}
        {hasScore && winnerPick && isValidWinnerPick(winnerPick) && (
          <p className={`mt-2 text-sm font-semibold ${getWinnerPickTextClass(winnerPick)}`}>
            {formatWinnerPickLabel(match, winnerPick)}
          </p>
        )}
      </div>

      {validationError && (
        <p className="mt-4 text-center text-sm text-red-400">{validationError}</p>
      )}

      <div className={`mt-6 grid gap-3 ${isFormDirty ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {isFormDirty && onReset && (
          <Button
            type="button"
            variant="secondary"
            className="w-full py-3 text-base"
            onClick={onReset}
            disabled={isSubmitting}
          >
            Redefinir
          </Button>
        )}
        <Button
          variant="gold"
          className="w-full py-3 text-base"
          onClick={handlePalpitarClick}
          disabled={isSubmitting || complementMode === 'complete'}
        >
          {isSubmitting ? 'Palpitando...' : submitLabel}
        </Button>
      </div>

      <AlertModal
        isOpen={showNameRequiredModal}
        title="Nome obrigatório"
        description="Digite seu nome no bolão para registrar o palpite."
        onClose={() => setShowNameRequiredModal(false)}
      />

      <AlertModal
        isOpen={showContentRequiredModal}
        title="Palpite incompleto"
        description="Informe quem vence, o placar previsto ou ambos. Você pode combinar opções diferentes, sem precisar que batam."
        onClose={() => setShowContentRequiredModal(false)}
      />
    </div>
  )
}
