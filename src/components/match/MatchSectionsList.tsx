import type { MatchGroups } from '../../models/match'
import type { MatchGridColumns } from '../../utils/matchGrid'
import { MatchSection } from './MatchSection'

interface MatchSectionsListProps {
  groups: MatchGroups
  columnsPerRow?: MatchGridColumns
}

export function MatchSectionsList({ groups, columnsPerRow = 3 }: MatchSectionsListProps) {
  return (
    <>
      <MatchSection
        title="Ao vivo"
        matches={groups.live}
        variant="live"
        columnsPerRow={columnsPerRow}
      />
      <MatchSection
        title="Próximos jogos"
        matches={groups.upcoming}
        variant="upcoming"
        columnsPerRow={columnsPerRow}
      />
      <MatchSection
        title="Encerrados"
        matches={groups.finished}
        variant="finished"
        columnsPerRow={columnsPerRow}
      />
      <MatchSection
        title="Não definidos"
        matches={groups.undefined}
        variant="undefined"
        columnsPerRow={columnsPerRow}
      />
    </>
  )
}
