import type { Match } from '../../models/match'
import type { WinnerPick } from '../../models/winnerPick'
import { getTeamDisplayName, isTeamDefined } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface WinnerPickSelectorProps {
  match: Match
  value: WinnerPick | null
  onChange: (value: WinnerPick | null) => void
  disabled?: boolean
}

export function WinnerPickSelector({
  match,
  value,
  onChange,
  disabled = false,
}: WinnerPickSelectorProps) {
  const homeLabel = getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)
  const awayLabel = getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)

  return (
    <div className="mb-6">
      <p className="mb-3 text-sm font-medium text-slate-300">
        Quem vence?{disabled ? ' (registrado)' : ''}
      </p>

      <div
        className={`grid gap-3 sm:grid-cols-3 ${disabled ? 'pointer-events-none opacity-70' : ''}`}
      >
        <WinnerOption
          label={homeLabel}
          team={match.homeTeam}
          selected={value === 'home'}
          onSelect={() => onChange(value === 'home' ? null : 'home')}
        />
        <WinnerOption
          label="Empate"
          selected={value === 'draw'}
          onSelect={() => onChange(value === 'draw' ? null : 'draw')}
          compact
        />
        <WinnerOption
          label={awayLabel}
          team={match.awayTeam}
          selected={value === 'away'}
          onSelect={() => onChange(value === 'away' ? null : 'away')}
        />
      </div>
    </div>
  )
}

interface WinnerOptionProps {
  label: string
  team?: Match['homeTeam']
  selected: boolean
  onSelect: () => void
  compact?: boolean
}

function WinnerOption({ label, team, selected, onSelect, compact = false }: WinnerOptionProps) {
  const defined = team ? isTeamDefined(team) : true

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[5.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition ${
        selected
          ? 'border-gold-500/60 bg-gold-500/10 text-white shadow-sm shadow-gold-500/10'
          : 'border-slate-700/50 bg-pitch-800/60 text-slate-300 hover:border-slate-600 hover:bg-pitch-800'
      }`}
      aria-pressed={selected}
    >
      {team && !compact ? (
        <TeamCrest
          crest={defined ? team.crest : null}
          name={team.name}
          isDefined={defined}
          size="sm"
        />
      ) : (
        <span className="text-2xl leading-none text-slate-400">=</span>
      )}
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </button>
  )
}
