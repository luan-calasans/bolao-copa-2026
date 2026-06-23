import type { Match } from '../../models/match'
import { useLargeDesktop } from '../../hooks/useLargeDesktop'
import type { MatchGridColumns } from '../../utils/matchGrid'
import { getMatchGridClass, shouldStackMatchCardActions } from '../../utils/matchGrid'
import { MatchCard } from './MatchCard'

interface MatchGridProps {
  matches: Match[]
  columnsPerRow?: MatchGridColumns
}

export function MatchGrid({ matches, columnsPerRow = 3 }: MatchGridProps) {
  const isLargeDesktop = useLargeDesktop()
  const stackActionButtons = shouldStackMatchCardActions(columnsPerRow, isLargeDesktop)

  if (matches.length === 0) return null

  return (
    <div className={`grid min-w-0 gap-4 ${getMatchGridClass(columnsPerRow)}`}>
      {matches.map((match, index) => (
        <div key={match.id} className="min-w-0">
          <MatchCard
            match={match}
            prioritizeCrests={index < 2}
            stackActionButtons={stackActionButtons}
          />
        </div>
      ))}
    </div>
  )
}
