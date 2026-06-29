import type { Team } from '../../models/team'
import { getTeamDisplayName, isTeamDefined } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface ScoreInputProps {
  value: number | null
  minScore?: number
  onChange: (value: number) => void
  team: Team
  disabled?: boolean
  readOnly?: boolean
  compact?: boolean
  isWinner?: boolean
}

export function ScoreInput({
  value,
  minScore = 0,
  onChange,
  team,
  disabled = false,
  readOnly = false,
  compact = false,
  isWinner = false,
}: ScoreInputProps) {
  const isInputLocked = disabled || readOnly
  const defined = isTeamDefined(team)
  const teamLabel = defined ? getTeamDisplayName(team.shortName, team.name) : 'Time a definir'
  const decrement = () => {
    if (isInputLocked || value === null) {
      return
    }

    onChange(Math.max(minScore, value - 1))
  }
  const increment = () => {
    if (isInputLocked) return
    onChange(Math.min(20, (value ?? minScore) + 1))
  }
  const canDecrement = !isInputLocked && value !== null && value > minScore

  return (
    <div
      className={`rounded-2xl border ${compact ? 'p-3' : 'p-5'} ${
        compact && isWinner
          ? 'border-brazil-green/50 bg-brazil-green/10'
          : 'border-slate-700/50 bg-pitch-800/60'
      } ${disabled && !compact ? 'opacity-70' : ''}`}
    >
      {!compact && (
        <div className="flex items-center justify-center gap-2">
          <TeamCrest
            crest={defined ? team.crest : null}
            name={team.name}
            isDefined={defined}
            size="md"
          />
          {defined ? (
            <p className="text-center font-semibold text-white">{teamLabel}</p>
          ) : (
            <span
              className="inline-block w-10 border-b border-dashed border-slate-600/50"
              aria-label="Time a definir"
            />
          )}
        </div>
      )}

      {compact && (
        <div className="mb-2 flex flex-col items-center gap-1.5">
          <TeamCrest
            crest={defined ? team.crest : null}
            name={team.name}
            isDefined={defined}
            size="md"
          />
          {defined ? (
            <p className="max-w-full truncate text-center text-xs font-semibold text-white">
              {teamLabel}
            </p>
          ) : (
            <span
              className="inline-block w-10 border-b border-dashed border-slate-600/50"
              aria-label="Time a definir"
            />
          )}
        </div>
      )}

      <div className={`flex items-center justify-center gap-4 ${compact ? '' : 'mt-4'}`}>
        {!compact && (
          <button
            type="button"
            onClick={decrement}
            disabled={!canDecrement}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-pitch-700 text-xl font-bold text-white transition hover:bg-pitch-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Diminuir placar de ${teamLabel}`}
          >
            −
          </button>
        )}
        <input
          type="number"
          min={minScore}
          max={20}
          value={value ?? ''}
          placeholder="—"
          onChange={(e) => {
            if (isInputLocked) return

            const raw = e.target.value

            if (raw === '') {
              return
            }

            const parsed = parseInt(raw, 10)
            if (!Number.isNaN(parsed)) {
              onChange(Math.min(20, Math.max(minScore, parsed)))
            }
          }}
          readOnly={readOnly}
          disabled={disabled && !readOnly}
          className={`score-input w-16 rounded-xl border border-slate-600 bg-pitch-900 py-2 text-center text-2xl font-bold text-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30 ${value === null ? 'placeholder:text-slate-500' : ''} ${readOnly ? 'cursor-default' : ''} disabled:cursor-not-allowed`}
          aria-label={`Placar de ${teamLabel}`}
        />
        {!compact && (
          <button
            type="button"
            onClick={increment}
            disabled={disabled}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-pitch-700 text-xl font-bold text-white transition hover:bg-pitch-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Aumentar placar de ${teamLabel}`}
          >
            +
          </button>
        )}
      </div>

      {value === null && !isInputLocked && !compact && (
        <p className="mt-2 text-center text-xs text-slate-500">Toque + para informar</p>
      )}

      {value !== null && value === minScore && minScore > 0 && (
        <p className="mt-2 text-center text-xs text-emerald-300/80">Mínimo atual: {minScore}</p>
      )}
    </div>
  )
}
