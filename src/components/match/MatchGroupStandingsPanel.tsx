import type { MatchGroupStandingsPreview } from '../../utils/matchGroupStandings'
import { StandingsGroupTable } from '../standings/StandingsGroupTable'

interface MatchGroupStandingsPanelProps {
  preview: MatchGroupStandingsPreview
}

export function MatchGroupStandingsPanel({ preview }: MatchGroupStandingsPanelProps) {
  return (
    <div className="mt-6">
      <StandingsGroupTable
        standing={preview.standing}
        highlightTeamIds={preview.highlightTeamIds}
        showTrends={preview.showTrends}
        variant="match"
      />
    </div>
  )
}
