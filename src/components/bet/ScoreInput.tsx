import type { Team } from '../../models/team'
import { getTeamDisplayName, isTeamDefined } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface ScoreInputProps {
  value: number | null
  minScore?: number
  onChange: (value: number) => void
  team: Team
  disabled?: boolean
}

export function ScoreInput({
  value,
  minScore = 0,
  onChange,
  team,
  disabled = false,
}: ScoreInputProps) {
  const defined = isTeamDefined(team)
  const teamLabel = defined ? getTeamDisplayName(team.shortName, team.name) : 'Time a definir'
  const decrement = () => {
    if (disabled || value === null) {
      return
    }

    onChange(Math.max(minScore, value - 1))
  }
  const increment = () => {
    if (disabled) return
    onChange(Math.min(20, (value ?? minScore) + 1))
  }
  const canDecrement = !disabled && value !== null && value > minScore

  return (
    <div
      className={`rounded-2xl border border-slate-700/50 bg-pitch-800/60 p-5 ${disabled ? 'opacity-70' : ''}`}
    >
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

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={decrement}
          disabled={!canDecrement}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-pitch-700 text-xl font-bold text-white transition hover:bg-pitch-900 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Diminuir placar de ${teamLabel}`}
        >
          −
        </button>
        <input
          type="number"
          min={minScore}
          max={20}
          value={value ?? ''}
          placeholder="—"
          onChange={(e) => {
            if (disabled) return

            const raw = e.target.value

            if (raw === '') {
              return
            }

            const parsed = parseInt(raw, 10)
            if (!Number.isNaN(parsed)) {
              onChange(Math.min(20, Math.max(minScore, parsed)))
            }
          }}
          disabled={disabled}
          className={`score-input w-16 rounded-xl border border-slate-600 bg-pitch-900 py-2 text-center text-2xl font-bold text-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/30 ${value === null ? 'placeholder:text-slate-500' : ''} disabled:cursor-not-allowed`}
        />
        <button
          type="button"
          onClick={increment}
          disabled={disabled}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-pitch-700 text-xl font-bold text-white transition hover:bg-pitch-900 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Aumentar placar de ${teamLabel}`}
        >
          +
        </button>
      </div>

      {value === null && !disabled && (
        <p className="mt-2 text-center text-xs text-slate-500">Toque + para informar</p>
      )}

      {value !== null && value === minScore && minScore > 0 && (
        <p className="mt-2 text-center text-xs text-emerald-300/80">Mínimo atual: {minScore}</p>
      )}
    </div>
  )
}
