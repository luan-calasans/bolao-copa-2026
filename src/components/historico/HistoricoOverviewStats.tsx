import type { TeamWorldCupStats, TournamentSummary } from '../../models/historicalWorldCup'
import { getHistoricalTeamDisplayName } from '../../utils/historicalTeamNames'
import { StatCard } from '../ui/StatCard'

interface HistoricoOverviewStatsProps {
  summaries: TournamentSummary[]
  teamStats: TeamWorldCupStats[]
}

export function HistoricoOverviewStats({ summaries, teamStats }: HistoricoOverviewStatsProps) {
  const latest = [...summaries].sort((left, right) => right.year - left.year)[0]
  const mostTitles = teamStats[0]
  const uniqueChampions = new Set(summaries.map((summary) => summary.champion)).size

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard label="Edições" value={String(summaries.length)} clickable={false} />
      <StatCard
        label="Último campeão"
        value={latest ? getHistoricalTeamDisplayName(latest.champion) : '—'}
        highlight
        clickable={false}
      />
      <StatCard
        label="Mais títulos"
        value={
          mostTitles
            ? `${mostTitles.titles} · ${mostTitles.displayName}`
            : '—'
        }
        highlight
        clickable={false}
      />
      <StatCard label="Países campeões" value={String(uniqueChampions)} clickable={false} />
    </div>
  )
}
