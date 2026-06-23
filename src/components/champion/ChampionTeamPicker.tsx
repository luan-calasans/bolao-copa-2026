import type { ApiTeamDetail } from '../../models/api.types'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface ChampionTeamPickerProps {
  teams: ApiTeamDetail[]
  selectedTeamId: number | null
  disabled?: boolean
  onSelect: (teamId: number) => void
}

export function ChampionTeamPicker({
  teams,
  selectedTeamId,
  disabled = false,
  onSelect,
}: ChampionTeamPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {teams.map((team) => {
        const teamId = team.id
        if (teamId == null) return null

        const teamName = getTeamDisplayName(team.shortName, team.name)
        const isSelected = selectedTeamId === teamId

        return (
          <button
            key={teamId}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(teamId)}
            aria-pressed={isSelected}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-3 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500/50 disabled:cursor-not-allowed disabled:opacity-60 ${
              isSelected
                ? 'border-gold-500/60 bg-gold-500/10 shadow-lg shadow-gold-500/10'
                : 'border-slate-700/40 bg-pitch-800/60 hover:border-brazil-yellow/30 hover:bg-pitch-800/90'
            }`}
          >
            <TeamCrest
              crest={team.crest}
              name={teamName}
              size="md"
              className="rounded-xl bg-pitch-900/50 p-1"
            />
            <span className="text-center text-xs font-bold text-white sm:text-sm">{teamName}</span>
          </button>
        )
      })}
    </div>
  )
}
