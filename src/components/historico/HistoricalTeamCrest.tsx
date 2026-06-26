import { getHistoricalTeamDisplayName } from '../../utils/historicalTeamNames'
import { getHistoricalTeamCrestUrl } from '../../utils/historicalTeamCrest'
import { TeamCrest } from '../ui/TeamCrest'

type HistoricalTeamCrestSize = 'sm' | 'md' | 'lg'

interface HistoricalTeamCrestProps {
  teamName: string
  size?: HistoricalTeamCrestSize
  className?: string
  loading?: 'lazy' | 'eager'
}

export function HistoricalTeamCrest({
  teamName,
  size = 'sm',
  className = '',
  loading = 'lazy',
}: HistoricalTeamCrestProps) {
  const displayName = getHistoricalTeamDisplayName(teamName)
  const crest = getHistoricalTeamCrestUrl(teamName)

  return (
    <TeamCrest
      crest={crest}
      name={displayName}
      size={size}
      className={className}
      isDefined={Boolean(crest)}
      loading={loading}
    />
  )
}
