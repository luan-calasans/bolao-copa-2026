import { Link } from 'react-router-dom'
import type { ApiTeamDetail } from '../../models/api.types'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface TeamCardProps {
  team: ApiTeamDetail
}

export function TeamCard({ team }: TeamCardProps) {
  const teamName = getTeamDisplayName(team.shortName, team.name)
  const teamId = team.id

  if (teamId == null) return null

  return (
    <Link
      to={`/times/${teamId}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-700/40 bg-pitch-800/60 p-4 transition hover:border-brazil-yellow/30 hover:bg-pitch-800/90 hover:shadow-lg"
    >
      <TeamCrest
        crest={team.crest}
        name={teamName}
        size="lg"
        className="rounded-xl bg-pitch-900/50 p-1 transition group-hover:brightness-110"
      />
      <span className="text-center text-sm font-bold text-white">{teamName}</span>
      {team.tla && (
        <span className="rounded-full bg-pitch-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
          {team.tla}
        </span>
      )}
    </Link>
  )
}
