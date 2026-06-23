import type { Team } from '../../models/team'
import { getTeamDisplayName, isTeamDefined } from '../../utils/teamDisplay'
import { TeamCrest } from './TeamCrest'

type TeamCrestSize = 'sm' | 'md' | 'lg'

interface TeamIdentityProps {
  team: Team
  size?: TeamCrestSize
  align?: 'left' | 'center' | 'right'
  nameClassName?: string
  crestClassName?: string
  className?: string
  crestLoading?: 'lazy' | 'eager'
  crestFetchPriority?: 'high' | 'low' | 'auto'
}

const alignClasses: Record<NonNullable<TeamIdentityProps['align']>, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
}

export function TeamIdentity({
  team,
  size = 'md',
  align = 'center',
  nameClassName = 'text-xs font-bold uppercase tracking-wide text-white sm:text-sm',
  crestClassName = '',
  className = '',
  crestLoading,
  crestFetchPriority,
}: TeamIdentityProps) {
  const defined = isTeamDefined(team)

  return (
    <div className={`flex flex-col gap-2 ${alignClasses[align]} ${className}`}>
      <TeamCrest
        crest={defined ? team.crest : null}
        name={team.name}
        isDefined={defined}
        size={size}
        className={crestClassName}
        loading={crestLoading}
        fetchPriority={crestFetchPriority}
      />
      {defined ? (
        <p className={nameClassName}>{getTeamDisplayName(team.shortName, team.name)}</p>
      ) : (
        <UndefinedTeamName className={nameClassName} />
      )}
    </div>
  )
}

function UndefinedTeamName({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block w-8 border-b border-dashed border-slate-600/50 ${className}`}
      aria-label="Time a definir"
    />
  )
}
